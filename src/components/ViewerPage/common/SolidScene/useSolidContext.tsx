import { useMemo, useCallback } from "react"
import tinycolor from "tinycolor2"
import Config from "components/ConfigCtx"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron, Face } from "math/polyhedra"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"
import PolyhedronForme from "math/formes/PolyhedronForme"

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb()
  return [r / 255, g / 255, b / 255]
}

function createFamilyColor(face: string, vertex: string) {
  return {
    primary: { face, vertex },
    secondary: {
      face: tinycolor(face).darken(20),
      vertex: tinycolor(vertex).darken(20),
    },
    edge: {
      ortho: tinycolor.mix(face, vertex, 50).desaturate(10),
      gyro: tinycolor.mix(face, vertex, 50).lighten(20),
    },
  }
}

const classicalColorScheme = {
  // yellow + purple
  3: createFamilyColor("#ffea00", "#db39ce"),
  // red + green
  4: createFamilyColor("#e00909", "#22e34c"),
  // blue + orange
  5: createFamilyColor("#2c65de", "#ff9100"),
}

const orthoFace = "dimgray"
const gyroFace = "lightgray"

function getClassicalColor(forme: ClassicalForme, face: Face) {
  const scheme = classicalColorScheme[forme.specs.data.family]
  const facet = forme.getFacet(face)
  // thing for the edge face
  if (!facet) {
    return scheme.edge[forme.specs.isSnub() ? "gyro" : "ortho"]
  }
  const faceSides = face.numSides > 5 ? "secondary" : "primary"
  return scheme[faceSides][facet]
}

function getCapstoneColor(forme: CapstoneForme, face: Face) {
  if (forme.isBaseTop(face)) {
    const faceSides = face.numSides > 5 ? "secondary" : "primary"
    return (classicalColorScheme as any)[forme.specs.data.base][faceSides].face
  } else if (forme.inBase(face)) {
    if (face.numSides === 3) {
      return (classicalColorScheme as any)[forme.specs.data.base].primary.vertex
    } else if (face.numSides === 4) {
      // TODO need to distinguish this from the edge faces
      return orthoFace
    } else {
      // TODO want this to be a separate color from the top face
      return classicalColorScheme[5].primary.face
    }
  } else {
    return forme.specs.isElongated() ? orthoFace : gyroFace
  }
}

function getFormeColor(polyhedron: PolyhedronForme, face: Face) {
  if (polyhedron instanceof ClassicalForme) {
    return getClassicalColor(polyhedron, face)
  } else if (polyhedron instanceof CapstoneForme) {
    return getCapstoneColor(polyhedron, face)
  }
}

const enableFormeColors = false

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
