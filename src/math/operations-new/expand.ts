import Classical from "data/specs/Classical"
import OperationPair from "./OperationPair"
import { Polyhedron } from "math/polyhedra"
import {
  getResizedVertices,
  getExpandedFaces,
} from "../operations/resizeOps/resizeUtils"

const graph = Classical.query
  .where((data) => data.operation === "regular")
  .map((entry) => {
    const target = entry.withData({ operation: "cantellate" })
    return {
      source: entry,
      intermediate: target,
      target,
      options: { faceType: entry.data.family },
    }
  })

interface Options {
  faceType?: 3 | 4 | 5
}

const coxeterNum = { 3: 4, 4: 6, 5: 10 }

function getContractLength(
  family: 3 | 4 | 5,
  polyhedron: Polyhedron,
  faceType: 3 | 4 | 5,
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

export default new OperationPair<Classical, Options>({
  graph,
  getPose({ geom, specs }, { faceType }) {
    const origin = geom.centroid()
    if (specs.isRegular()) {
      const face = geom.getFace()
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: face.sideLength(),
        orientation: [face.normal(), crossAxis],
      }
    }
    if (specs.isCantellated()) {
      // depends on the face type given in options
      const face = geom.faces.find(
        (face) =>
          face.numSides === faceType &&
          face.adjacentFaces().every((f) => f.numSides === 4),
      )!
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: face.sideLength(),
        orientation: [face.normal(), crossAxis],
      }
    }
    // FIXME handle expanding truncated solids
    throw new Error(`Cannot find pose`)
  },
  toStart({ specs, geom }, { faceType = 3 }) {
    // const resultLength = info.isBevelled()
    //   ? getContractLengthSemi(polyhedron, faceType, result)
    //   : getContractLength(info.data.family, polyhedron, faceType)

    const resultLength = getContractLength(specs.data.family, geom, faceType)

    // Take all the stuff and push it inwards
    const contractFaces = getExpandedFaces(geom, faceType)

    // const angle = specs.isBevelled() ? 0 : -getSnubAngle(polyhedron, contractFaces)
    const angle = 0

    return getResizedVertices(contractFaces, resultLength, angle)
  },
  toEnd({ geom }) {
    return geom.vertices
  },
})
