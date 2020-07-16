import { flatMapUniq } from "utils"
import { Polyhedron, Face } from "math/polyhedra"

type ExpansionType = "cantellate" | "snub"

function expansionType(polyhedron: Polyhedron): ExpansionType {
  return polyhedron.getVertex().adjacentFaceCounts()[3] >= 3
    ? "snub"
    : "cantellate"
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
}

export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron)
  if (typeof nSides === "number" && face.numSides !== nSides) return false
  if (!face.isValid()) return false
  return face.adjacentFaces().every((f) => f.numSides === edgeShape[type])
}

function getFaceDistance(face1: Face, face2: Face) {
  let dist = 0
  let current = [face1]
  while (!face2.inSet(current)) {
    dist++
    current = flatMapUniq(current, (face) => face.adjacentFaces(), "index")

    if (dist > 10) {
      throw new Error("we went toooooo far")
    }
  }
  return dist
}

function getIcosahedronContractFaces(polyhedron: Polyhedron) {
  const result = []
  let toTest = polyhedron.faces
  while (toTest.length > 0) {
    const [next, ...rest] = toTest
    result.push(next)
    toTest = rest.filter((face) => getFaceDistance(face, next) === 3)
  }
  return result
}

function getCuboctahedronContractFaces(
  polyhedron: Polyhedron,
  parity?: number,
) {
  let f0 = polyhedron.faceWithNumSides(3)
  if (parity === 1) {
    f0 = f0.edges[0].twin().next().twinFace()
  }
  const rest = f0.edges.map((e) => e.twin().next().next().twinFace())
  return [f0, ...rest]
}

function getTruncatedOctahedronContractFaces(polyhedron: Polyhedron) {
  const f0 = polyhedron.faceWithNumSides(6)
  const rest = f0.edges
    .filter((e) => e.twinFace().numSides === 4)
    .map((e) => e.twin().next().next().twinFace())
  return [f0, ...rest]
}

// FIXME split this up into multiple functions for the different operations
export function getExpandedFaces(
  polyhedron: Polyhedron,
  faceType?: number,
  parity?: number,
) {
  switch (polyhedron.name) {
    case "cuboctahedron":
      return getCuboctahedronContractFaces(polyhedron, parity)
    case "icosahedron":
      return getIcosahedronContractFaces(polyhedron)
    case "truncated octahedron":
      return getTruncatedOctahedronContractFaces(polyhedron)
    case "truncated icosidodecahedron":
    case "truncated cuboctahedron":
      return polyhedron.faces.filter((f) => f.numSides === faceType)
    default:
      return polyhedron.faces.filter((face) =>
        isExpandedFace(polyhedron, face, faceType),
      )
  }
}
