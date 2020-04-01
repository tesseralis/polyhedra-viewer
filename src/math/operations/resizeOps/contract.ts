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

const familyOpts: Family[] = [3, 4, 5]

interface Options {
  faceType?: FaceType
}

// Return the family of an *expanded* polyhedron
function getFamily(polyhedron: Polyhedron) {
  return familyOpts.find((family) => {
    return Classical.query.hasNameWhere(
      polyhedron.name,
      (data) => data.family === family,
    )
  })!
}

const coxeterNum: Record<Family, number> = { 3: 4, 4: 6, 5: 10 }

function getContractLength(polyhedron: Polyhedron, faceType: FaceType) {
  // Calculate dihedral angle
  // https://en.wikipedia.org/wiki/Platonic_solid#Angles
  const n = getFamily(polyhedron)
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
  result: string,
) {
  const reference = Polyhedron.get(result)
  const referenceFace = reference.faceWithNumSides(faceType)
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength()
  return referenceLength
}

export function applyContract(
  polyhedron: Polyhedron,
  { faceType = isBevelled(polyhedron) ? 6 : 3 }: Options,
  result: string,
) {
  const resultLength = isBevelled(polyhedron)
    ? getContractLengthSemi(polyhedron, faceType, result)
    : getContractLength(polyhedron, faceType)

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

function isBevelled(polyhedron: Polyhedron) {
  return Classical.query.hasNameWhere(
    polyhedron.name,
    ({ operation }) => operation === "bevel",
  )
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = makeOperation<Options>("contract", {
  apply: applyContract,
  optionTypes: ["faceType"],

  canApplyTo(info) {
    if (!info.isClassical()) return false
    return ["bevel", "cantellate", "snub"].includes(info.data.operation)
  },

  getResult(info, { faceType }) {
    if (!info.isClassical()) throw new Error()
    const { family, operation } = info.data
    const isVertex = faceType === (operation === "bevel" ? 6 : 3)
    return info.withData({
      operation: operation === "bevel" ? "truncate" : "regular",
      facet: family === 3 ? undefined : isVertex ? "vertex" : "face",
    })
  },

  hasOptions(polyhedron) {
    return getFamily(polyhedron) !== 3
  },

  allOptionCombos(polyhedron) {
    if (getFamily(polyhedron) === 3) return [{}]
    const multiplier = isBevelled(polyhedron) ? 2 : 1
    const info = polyhedron.info
    if (!info.isClassical()) throw new Error("Invalid polyhedron")
    return [
      { faceType: (3 * multiplier) as any },
      { faceType: (info.data.family * multiplier) as any },
    ]
  },

  hitOption: "faceType",
  getHitOption(polyhedron, hitPoint) {
    const hitFace = polyhedron.hitFace(hitPoint)
    const faceType = hitFace.numSides as FaceType // TODO unsure if always valid
    if (isBevelled(polyhedron)) {
      const isValid = hitFace.numSides > 4
      return isValid ? { faceType } : {}
    }
    const isValid = isExpandedFace(polyhedron, hitFace)
    return isValid ? { faceType } : {}
  },

  faceSelectionStates(polyhedron, { faceType }) {
    if (isBevelled(polyhedron)) {
      return polyhedron.faces.map((face) => {
        if (faceType && face.numSides === faceType) {
          return "selected"
        }
        if (face.numSides !== 4) return "selectable"
        return undefined
      })
    }
    return polyhedron.faces.map((face) => {
      if (faceType && isExpandedFace(polyhedron, face, faceType))
        return "selected"
      if (isExpandedFace(polyhedron, face)) return "selectable"
      return undefined
    })
  },
})
