import { useMemo, useCallback } from "react"
import tinycolor from "tinycolor2"
import Config from "components/ConfigCtx"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron, Face } from "math/polyhedra"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"
import CompositeForme from "math/formes/CompositeForme"
import PolyhedronForme from "math/formes/PolyhedronForme"

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb()
  return [r / 255, g / 255, b / 255]
}

function createFamilyColor(face: string, vertex: string) {
  return {
    primary: { face, vertex },
    secondary: {
      face: tinycolor(face).darken(25),
      vertex: tinycolor(vertex).darken(25),
    },
    edge: {
      ortho: tinycolor.mix(face, vertex, 33).desaturate(25).lighten(),
      gyro: tinycolor.mix(face, vertex, 67).desaturate(25).lighten(),
    },
  }
}

const colorScheme = {
  2: createFamilyColor("#000000", "#ffffff"),
  // green + cyan
  3: createFamilyColor("#1bcc3b", "#15ace8"),
  // red + yellow
  4: createFamilyColor("#ff3d3d", "#ffe100"),
  // blue + magenta
  5: createFamilyColor("#424eed", "#f24bd4"),
}

function getClassicalColor(forme: ClassicalForme, face: Face) {
  const scheme = colorScheme[forme.specs.data.family]
  const facet = forme.getFacet(face)
  // thing for the edge face
  if (!facet) {
    return scheme.edge[forme.specs.isSnub() ? "gyro" : "ortho"]
  }
  const faceSides = face.numSides > 5 ? "secondary" : "primary"
  return scheme[faceSides][facet]
}

function getCapstoneColor(forme: CapstoneForme, face: Face) {
  const scheme = colorScheme[forme.specs.data.base]
  if (forme.isBaseTop(face)) {
    const faceSides = face.numSides > 5 ? "secondary" : "primary"
    return scheme[faceSides].face
  } else if (forme.inBase(face)) {
    if (face.numSides === 3) {
      return scheme.primary.vertex
    } else if (face.numSides === 4) {
      // TODO need to distinguish this from the edge faces
      return scheme.edge.ortho
    } else {
      // TODO want this to be a separate color from the top face
      return colorScheme[5].primary.face
    }
  } else {
    const side = forme.specs.isElongated() ? "ortho" : ("gyro" as const)
    return tinycolor(scheme.edge[side]).desaturate(2).lighten(1)
  }
}

function getCompositeColor(forme: CompositeForme, face: Face) {
  if (forme.isAugmentedPrism()) {
    const sourceSpecs = forme.specs.sourcePrism()
    const scheme = colorScheme[sourceSpecs.data.base]
    if (forme.isBaseFace(face)) {
      return scheme[sourceSpecs.data.type].face
    } else if (forme.isSideFace(face)) {
      return scheme.edge.ortho
    } else {
      // augmented face
      return tinycolor(scheme.primary.vertex).lighten(25)
    }
  } else if (forme.isAugmentedClassical()) {
    const scheme = colorScheme[forme.specs.sourceClassical().data.family]
    const type = forme.specs.sourceClassical().isTruncated()
      ? "secondary"
      : ("primary" as const)
    if (forme.isMainFace(face)) {
      return scheme[type].face
    } else if (forme.isMinorFace(face)) {
      return scheme.primary.vertex
    } else if (forme.isCapTop(face)) {
      return tinycolor(scheme.primary.face).lighten(25)
    } else {
      return tinycolor(
        face.numSides === 3 ? scheme.primary.vertex : scheme.edge.ortho,
      ).lighten(25)
    }
  } else if (forme.isDiminishedSolid()) {
    const scheme = colorScheme[5]
    if (forme.isAugmentedFace(face)) {
      return tinycolor(scheme.primary.vertex).lighten(25)
    } else if (forme.isDiminishedFace(face)) {
      return tinycolor(scheme.primary.face).darken(25)
    } else {
      return scheme.primary.vertex
    }
  }
}

function getFormeColor(polyhedron: PolyhedronForme, face: Face) {
  if (polyhedron instanceof ClassicalForme) {
    return getClassicalColor(polyhedron, face)
  } else if (polyhedron instanceof CapstoneForme) {
    return getCapstoneColor(polyhedron, face)
  } else if (polyhedron instanceof CompositeForme) {
    return getCompositeColor(polyhedron, face)
  }
}

const enableFormeColors = true

// Hook that takes data from Polyhedron and Animation states and decides which to use.
export default function useSolidContext() {
  const { colors } = Config.useState()
  const polyhedron = PolyhedronCtx.useState()

  const {
    solidData,
    isTransitioning,
    faceColors = [],
  } = TransitionCtx.useState()
  const { operation, options = {} } = OperationCtx.useState()

  const getSelectionColor = useCallback(
    (face, color) => {
      if (!operation) return color
      switch (operation.selectionState(face, polyhedron, options)) {
        case "selected":
          return tinycolor(color).lighten(25)
        case "selectable":
          return tinycolor(color).lighten()
        default:
          return color
      }
    },
    [operation, options, polyhedron],
  )

  const formeColors = useMemo(() => {
    if (!enableFormeColors) return
    return polyhedron.geom.faces.map((f) =>
      getSelectionColor(f, getFormeColor(polyhedron, f)),
    )
  }, [polyhedron, getSelectionColor])

  // Colors when animation is being applied
  const transitionColors = useMemo(
    () =>
      isTransitioning &&
      solidData!.faces.map((face, i) => faceColors[i] || colors[face.length]),
    [solidData, faceColors, colors, isTransitioning],
  )
  const geom: Polyhedron = polyhedron.geom

  // Colors when in operation mode and hit options are being selected
  const operationColors = useMemo(() => {
    return geom.faces.map((face) =>
      getSelectionColor(face, colors[face.numSides]),
    )
  }, [colors, geom.faces, getSelectionColor])

  const normalizedColors = useMemo(() => {
    const rawColors =
      transitionColors ||
      formeColors ||
      operationColors ||
      geom.faces.map((f) => colors[f.numSides])
    return rawColors.map(toRgb)
  }, [formeColors, transitionColors, operationColors, geom, colors])

  return {
    colors: normalizedColors,
    solidData: isTransitioning ? solidData! : polyhedron.geom.solidData,
  }
}
