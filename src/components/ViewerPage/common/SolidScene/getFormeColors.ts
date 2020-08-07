import { Color } from "three"
import { Face, Cap } from "math/polyhedra"
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
      face: faceColor.clone().offsetHSL(0, 0, -1 / 3),
      vertex: vertexColor.clone().offsetHSL(0, 0, -1 / 3),
    },
    edge: {
      ortho: faceColor
        .clone()
        .lerp(vertexColor, 1 / 3)
        .offsetHSL(0, -1 / 4, 0),
      gyro: faceColor
        .clone()
        .lerp(vertexColor, 3 / 3)
        .offsetHSL(0, -1 / 4, 0),
    },
  }
}

const colorScheme = {
  // black + white
  2: createFamilyColor("#000000", "#ffffff"),
  // yellow + orange
  3: createFamilyColor("#ffe100", "#ff8400"),
  // red + purple
  4: createFamilyColor("#ff3d3d", "#c616f2"),
  // blue + green
  5: createFamilyColor("#1c7bff", "#1bcc3b"),
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
    const end = forme.containingEnd(face)
    if (end instanceof Cap) {
      const top = end.innerVertices()
      if (forme.isTop(face)) {
        return scheme.primary.face
      } else if (face.numSides === 3) {
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
        return face.vertices.map((v) => {
          return (v.inSet(top) ? scheme.edge.gyro : scheme.edge.ortho)
            .clone()
            .offsetHSL(0, 0, 0.15)
        })
      } else {
        return new Color()
      }
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
  } else {
    return new Color()
  }
}

export default function getFormeColors(
  polyhedron: PolyhedronForme,
  face: Face,
) {
  if (polyhedron.isClassical()) {
    return getClassicalColor(polyhedron, face)
  } else if (polyhedron.isCapstone()) {
    return getCapstoneColor(polyhedron, face)
  } else if (polyhedron.isComposite()) {
    return getCompositeColor(polyhedron, face)
  } else {
    return new Color()
  }
}
