import { Color } from "three"
import { Face, Cap } from "math/polyhedra"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"
import CompositeForme from "math/formes/CompositeForme"
import PolyhedronForme from "math/formes/PolyhedronForme"

type FaceColor = Color | Color[]

export interface Appearance {
  color: FaceColor
  material: number
}

const facetMaterial = 0
const capMaterial = 0
const edgeFaceMaterial = 1
const prismMaterial = 1

export function toColor(color: any): Color {
  if (color instanceof Color) return color
  if (color.color) {
    return { ...color, color: new Color(color.color) }
  }
  return new Color(color)
}

export function lighten(color: Color, amount: number) {
  return toColor(color)
    .clone()
    .offsetHSL(0, 0, amount / 100)
}

export function darken(color: Color, amount: number) {
  return toColor(color)
    .clone()
    .offsetHSL(0, 0, -amount / 100)
}

export function mixColor(appearance: Appearance, mixer: (c: Color) => Color) {
  const { color, material } = appearance
  const newColor = color instanceof Color ? mixer(color) : color.map(mixer)
  return {
    color: newColor,
    material,
  }
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
      material: edgeFaceMaterial,
    }
  }
  const faceSides = face.numSides > 5 ? "secondary" : "primary"
  return {
    color: scheme[faceSides][facet],
    material: facetMaterial,
  }
}

function getCapstoneColor(forme: CapstoneForme, face: Face): Appearance {
  const scheme = colorScheme[forme.specs.data.base]
  if (forme.isTop(face)) {
    const faceSides = face.numSides > 5 ? "secondary" : "primary"
    return {
      color: scheme[faceSides].face,
      material: capMaterial,
    }
  } else if (forme.isContainedInEnd(face)) {
    const end = forme.containingEnd(face)
    if (end instanceof Cap) {
      const top = end.innerVertices()
      if (forme.isTop(face)) {
        return {
          color: scheme.primary.face,
          material: capMaterial,
        }
      } else if (face.numSides === 3) {
        return {
          color: face.vertices.map((v) => {
            if (v.inSet(top)) {
              return scheme.primary.face
            } else {
              return scheme.primary.vertex
            }
          }),
          material: capMaterial,
        }
        // return scheme.primary.vertex
      } else if (face.numSides === 4) {
        // TODO need to distinguish this from the edge faces
        return {
          color: face.vertices.map((v) => {
            return (v.inSet(top) ? scheme.edge.gyro : scheme.edge.ortho)
              .clone()
              .offsetHSL(0, 0, 0.15)
          }),
          material: capMaterial,
        }
      } else {
        // FIXME
        return {
          color: new Color(),
          material: prismMaterial,
        }
      }
    } else {
      // TODO want this to be a separate color from the top face
      return {
        color: colorScheme[5].primary.face,
        material: capMaterial,
      }
    }
  } else {
    const side = forme.specs.isElongated() ? "ortho" : "gyro"
    return {
      color: scheme.edge[side].clone().offsetHSL(0, -1 / 50, 1 / 100),
      material: prismMaterial,
    }
  }
}

function getCompositeColor(forme: CompositeForme, face: Face): Appearance {
  if (forme.isAugmentedPrism()) {
    const sourceSpecs = forme.specs.sourcePrism()
    const scheme = colorScheme[sourceSpecs.data.base]
    if (forme.isEndFace(face)) {
      return {
        color: scheme[sourceSpecs.data.type].face,
        material: capMaterial,
      }
    } else if (forme.isSideFace(face)) {
      return {
        color: scheme.edge.ortho,
        material: prismMaterial,
      }
    } else {
      // augmented face
      return {
        color: scheme.primary.vertex.clone().offsetHSL(0, 0, 1 / 4),
        material: capMaterial,
      }
    }
  } else if (forme.isAugmentedClassical()) {
    const scheme = colorScheme[forme.specs.sourceClassical().data.family]
    const type = forme.specs.sourceClassical().isTruncated()
      ? "secondary"
      : ("primary" as const)
    if (forme.isMainFace(face)) {
      return {
        color: scheme[type].face,
        material: facetMaterial,
      }
    } else if (forme.isMinorFace(face)) {
      return {
        color: scheme.primary.vertex,
        material: facetMaterial,
      }
    } else if (forme.isCapTop(face)) {
      return {
        color: lighten(scheme.primary.face, 25),
        material: capMaterial,
      }
    } else {
      return {
        color: lighten(
          face.numSides === 3 ? scheme.primary.vertex : scheme.edge.ortho,
          25,
        ),
        material: capMaterial,
      }
    }
  } else if (forme.isDiminishedSolid()) {
    const scheme = colorScheme[5]
    if (forme.isAugmentedFace(face)) {
      return {
        color: lighten(scheme.primary.vertex, 25),
        material: facetMaterial,
      }
    } else if (forme.isDiminishedFace(face)) {
      return {
        color: darken(scheme.primary.face, 25),
        material: facetMaterial,
      }
    } else {
      return {
        color: scheme.primary.vertex,
        material: capMaterial,
      }
    }
  } else if (forme.isGyrateSolid()) {
    const scheme = colorScheme[5]
    const mix = (color: Color) => {
      if (forme.isGyrateFace(face)) {
        return color.clone().offsetHSL(0, 0, 0.25)
      }
      return color
    }
    if (forme.isDiminishedFace(face)) {
      return {
        color: mix(scheme.secondary.face),
        material: facetMaterial,
      }
    } else if (forme.isFacetFace(face, "face")) {
      return {
        color: mix(scheme.primary.face),
        material: facetMaterial,
      }
    } else if (forme.isFacetFace(face, "vertex")) {
      return {
        color: mix(scheme.primary.vertex),
        material: facetMaterial,
      }
    } else {
      return {
        color: mix(scheme.edge.ortho),
        material: edgeFaceMaterial,
      }
    }
  }
  return {
    color: new Color(),
    material: 0,
  }
}

export default function getFormeColors(
  polyhedron: PolyhedronForme,
  face: Face,
): Appearance {
  if (polyhedron.isClassical()) {
    return getClassicalColor(polyhedron, face)
  } else if (polyhedron.isCapstone()) {
    return getCapstoneColor(polyhedron, face)
  } else if (polyhedron.isComposite()) {
    return getCompositeColor(polyhedron, face)
  } else {
    return {
      color: new Color(),
      material: 0,
    }
  }
}
