import { Color } from "three"
import { PolyhedronForme as Forme } from "math/formes"
import { Face } from "math/polyhedra"

interface ClassicalFace {
  type: "classical"
  family: 3 | 4 | 5
  polygonType: "primary" | "secondary"
  facet?: "face" | "vertex"
  expansion?: "prism" | "antiprism"
}

interface CapstoneFace {
  type: "capstone"
  polygonType: "primary" | "secondary"
  base: 2 | 3 | 4 | 5
  elongation?: "prism" | "antiprism"
  capPosition?: "prism" | "top" | "side"
  sideColors?: ("top" | "middle" | "base")[]
}

type FaceType = ClassicalFace | CapstoneFace

type FaceColor = Color | Color[]

export interface Appearance {
  color: FaceColor
  material: number
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
      prism: faceColor
        .clone()
        .lerp(vertexColor, 1 / 3)
        .offsetHSL(0, -1 / 4, 0),
      antiprism: faceColor
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

// TODO this is still REALLY UGLY and I dunno what to do for cap faces
function getFaceAppearance(faceType: FaceType): FaceColor {
  if (faceType.type === "classical") {
    const scheme = colorScheme[faceType.family]
    if (faceType.facet) {
      // TODO primary material
      return scheme[faceType.polygonType][faceType.facet]
    } else {
      // TODO secondary material
      return scheme.edge[faceType.expansion!]
    }
  }
  if (faceType.type === "capstone") {
    const scheme = colorScheme[faceType.base]
    if (faceType.capPosition === "prism") {
      return scheme[faceType.polygonType].face
    }
    if (faceType.capPosition === "top") {
      return scheme.primary.face
    }
    if (faceType.capPosition === "side") {
      const sideColors = faceType.sideColors!
      const n = sideColors.length
      if (n === 3) {
        return sideColors.map((col) => {
          switch (col) {
            case "top":
              return scheme.primary.vertex
            case "middle":
              return scheme.edge.prism.clone().lerp(scheme.primary.vertex, 0.5)
            case "base":
              // FIXME base this on the inner color
              return scheme.edge.antiprism
          }
          throw new Error(`blah`)
        })
      }
      if (n === 4) {
        return sideColors.map((col) => {
          switch (col) {
            case "top":
              return scheme.primary.face
            case "base":
              return scheme.edge.prism
            default:
              throw new Error(`Square cap face in rotunda?`)
          }
        })
      }
      if (n === 5) {
        return sideColors.map((col) => {
          switch (col) {
            case "top":
              return scheme.primary.face
            case "middle":
              return scheme.edge.prism.clone().lerp(scheme.primary.face, 0.5)
            case "base":
              return scheme.edge.prism
          }
          throw new Error(`blaaah`)
        })
      }
      throw new Error(`Invalid numsides for side face`)
    }
    if (faceType.elongation) {
      return scheme.edge[faceType.elongation]
    }
  }
  throw new Error(`Unknown face type`)
}

export default function getFormeColors(forme: Forme, face: Face): Appearance {
  return {
    color: getFaceAppearance(forme.faceAppearance(face)),
    material: 1,
  }
}
