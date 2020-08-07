import { Color } from "three"
import { useMemo, useCallback } from "react"
import Config from "components/ConfigCtx"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron, Face, Cap } from "math/polyhedra"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"
import CompositeForme from "math/formes/CompositeForme"
import PolyhedronForme from "math/formes/PolyhedronForme"

function toColor(color: any): Color {
  if (color instanceof Color) return color
  if (color.color) {
    return { ...color, color: new Color(color.color) }
  }
  return new Color(color)
}

function lighten(color: Color, amount: number) {
  return toColor(color)
    .clone()
    .offsetHSL(0, 0, amount / 100)
}

function darken(color: Color, amount: number) {
  return toColor(color)
    .clone()
    .offsetHSL(0, 0, -amount / 100)
}

function createFamilyColor(face: string, vertex: string) {
  const faceColor = new Color(face)
  const vertexColor = new Color(vertex)
  return {
    primary: { face: faceColor, vertex: vertexColor },
    secondary: {
      face: faceColor.clone().offsetHSL(0, 0, -1 / 4),
      vertex: vertexColor.clone().offsetHSL(0, 0, -1 / 4),
    },
    edge: {
      ortho: faceColor
        .clone()
        .lerp(vertexColor, 1 / 3)
        .offsetHSL(0, -1 / 4, 1 / 10),
      gyro: faceColor
        .clone()
        .lerp(vertexColor, 2 / 3)
        .offsetHSL(0, -1 / 4, 1 / 10),
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
    return {
      color: scheme.edge[forme.specs.isSnub() ? "gyro" : "ortho"],
      material: 1,
    }
  }
  const faceSides = face.numSides > 5 ? "secondary" : "primary"
  return {
    color: scheme[faceSides][facet],
    material: 0,
  }
}

function getCapstoneColor(forme: CapstoneForme, face: Face) {
  const scheme = colorScheme[forme.specs.data.base]
  if (forme.isTop(face)) {
    const faceSides = face.numSides > 5 ? "secondary" : "primary"
    return scheme[faceSides].face
  } else if (forme.isContainedInEnd(face)) {
    if (face.numSides === 3) {
      const cap = forme.containingEnd(face) as Cap
      const top = cap.innerVertices()
      return face.vertices.map((v) => {
        if (v.inSet(top)) {
          return scheme.primary.face
        } else {
          return scheme.primary.vertex
        }
      })
      // return scheme.primary.vertex
    } else if (face.numSides === 4) {
      // TODO need to distinguish this from the edge faces
      return scheme.edge.ortho
    } else {
      // TODO want this to be a separate color from the top face
      return colorScheme[5].primary.face
    }
  } else {
    const side = forme.specs.isElongated() ? "ortho" : ("gyro" as const)
    return {
      color: scheme.edge[side].clone().offsetHSL(0, -1 / 50, 1 / 100),
      material: 1,
    }
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
      return scheme.primary.vertex.clone().offsetHSL(0, 0, 1 / 4)
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
      return lighten(scheme.primary.face, 25)
    } else {
      return lighten(
        face.numSides === 3 ? scheme.primary.vertex : scheme.edge.ortho,
        25,
      )
    }
  } else if (forme.isDiminishedSolid()) {
    const scheme = colorScheme[5]
    if (forme.isAugmentedFace(face)) {
      return lighten(scheme.primary.vertex, 25)
    } else if (forme.isDiminishedFace(face)) {
      return darken(scheme.primary.face, 25)
    } else {
      return scheme.primary.vertex
    }
  }
}

function getFormeColor(polyhedron: PolyhedronForme, face: Face) {
  if (polyhedron.isClassical()) {
    return getClassicalColor(polyhedron, face)
  } else if (polyhedron.isCapstone()) {
    return getCapstoneColor(polyhedron, face)
  } else if (polyhedron.isComposite()) {
    return getCompositeColor(polyhedron, face)
  }
}

// Hook that takes data from Polyhedron and Animation states and decides which to use.
export default function useSolidContext() {
  const { enableFormeColors, colors } = Config.useState()
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
          return lighten(color, 25)
        case "selectable":
          return lighten(color, 10)
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
  }, [polyhedron, enableFormeColors, getSelectionColor])

  // Colors when animation is being applied
  const transitionColors = useMemo(() => {
    return isTransitioning && faceColors
  }, [faceColors, isTransitioning])
  const geom: Polyhedron = polyhedron.geom

  // Colors when in operation mode and hit options are being selected
  const operationColors = useMemo(() => {
    return geom.faces.map((face) =>
      getSelectionColor(face, colors[face.numSides]),
    )
  }, [colors, geom.faces, getSelectionColor])

  const normalizedColors: Color[] = useMemo(() => {
    const rawColors =
      transitionColors ||
      formeColors ||
      operationColors ||
      geom.faces.map((f) => colors[f.numSides])
    return rawColors
  }, [formeColors, transitionColors, operationColors, geom, colors])

  return {
    colors: normalizedColors,
    solidData: isTransitioning ? solidData! : polyhedron.geom.solidData,
  }
}
