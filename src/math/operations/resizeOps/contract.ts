import { Polygon } from "data/polygons"
import Classical from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import {
  getSnubAngle,
  isExpandedFace,
  getResizedVertices,
  getExpandedFaces,
} from "./resizeUtils"
import makeOperation from "../makeOperation"

// TODO hopefully there's a better way to do this once we make the new opGraph
type FaceType = Polygon
type Family = 3 | 4 | 5

interface Options {
  faceType?: FaceType
}

const coxeterNum: Record<Family, number> = { 3: 4, 4: 6, 5: 10 }

function getContractLength(
  family: Family,
  polyhedron: Polyhedron,
  faceType: FaceType,
) {
  // Calculate dihedral angle
  // https://en.wikipedia.org/wiki/Platonic_solid#Angles
  const n = family
  const s = polyhedron.edgeLength()
  const p = faceType
  const q = 3 + n - p
  const h = coxeterNum[n]
  const tanTheta2 = Math.cos(Math.PI / q) / Math.sin(Math.PI / h)

  // Calculate the inradius
  // https://en.wikipedia.org/wiki/Platonic_solid#Radii,_area,_and_volume
  return (s / 2 / Math.tan(Math.PI / p)) * tanTheta2
}

// contract length of a bevelled polyhedron
// TODO calculate this without a reference
function getContractLengthSemi(
  polyhedron: Polyhedron,
  faceType: FaceType,
  reference: Polyhedron,
) {
  const referenceFace = reference.faceWithNumSides(faceType)
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength()
  return referenceLength
}

export function applyContract(
  info: Classical,
  polyhedron: Polyhedron,
  { faceType = isBevelled(polyhedron) ? 6 : 3 }: Options,
  result: Polyhedron,
) {
  const resultLength = isBevelled(polyhedron)
    ? getContractLengthSemi(polyhedron, faceType, result)
    : getContractLength(info.data.family, polyhedron, faceType)

  // Take all the stuff and push it inwards
  const contractFaces = getExpandedFaces(polyhedron, faceType)

  const angle = isBevelled(polyhedron)
    ? 0
    : -getSnubAngle(polyhedron, contractFaces)

  const endVertices = getResizedVertices(contractFaces, resultLength, angle)
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  }
}

// TODO figure out how to get rid of this function
function isBevelled(polyhedron: Polyhedron) {
  return Classical.query.hasNameWhere(
    polyhedron.name,
    ({ operation }) => operation === "bevel",
  )
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = makeOperation<Classical, Options>("contract", {
  apply({ specs, geom }, options, result) {
    return applyContract(specs, geom, options, result)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return info.isBevelled() || info.isCantellated() || info.isSnub()
  },

  getResult({ specs }, { faceType }) {
    const isVertex = faceType === (specs.isBevelled() ? 6 : 3)
    return specs.withData({
      operation: specs.isBevelled() ? "truncate" : "regular",
      facet: isVertex ? "vertex" : "face",
    })
  },

  hasOptions(info) {
    return !info.isTetrahedral()
  },

  *allOptionCombos({ specs }) {
    if (specs.isTetrahedral()) {
      yield {}
    } else {
      const multiplier = specs.isBevelled() ? 2 : 1
      yield { faceType: (3 * multiplier) as any }
      yield { faceType: (specs.data.family * multiplier) as any }
    }
  },

  hitOption: "faceType",
  getHitOption({ geom }, hitPoint) {
    const hitFace = geom.hitFace(hitPoint)
    const faceType = hitFace.numSides as FaceType // TODO unsure if always valid
    if (isBevelled(geom)) {
      const isValid = hitFace.numSides > 4
      return isValid ? { faceType } : {}
    }
    const isValid = isExpandedFace(geom, hitFace)
    return isValid ? { faceType } : {}
  },

  faceSelectionStates({ geom }, { faceType }) {
    if (isBevelled(geom)) {
      return geom.faces.map((face) => {
        if (faceType && face.numSides === faceType) {
          return "selected"
        }
        if (face.numSides !== 4) return "selectable"
        return undefined
      })
    }
    return geom.faces.map((face) => {
      if (faceType && isExpandedFace(geom, face, faceType)) return "selected"
      if (isExpandedFace(geom, face)) return "selectable"
      return undefined
    })
  },
})
