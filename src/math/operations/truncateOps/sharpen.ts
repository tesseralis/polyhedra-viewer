import { set, flatMapDeep, meanBy } from "lodash-es"

import { Polyhedron, Vertex, Face, Edge } from "math/polyhedra"
import makeOperation from "../makeOperation"

interface SharpenOptions {
  faceType?: number
}

// Adjacent faces of the vertex with a sharpen face first
function getShiftedAdjacentFaces(vertex: Vertex, facesTosharpen: Face[]) {
  const adjFaces = vertex.adjacentFaces()
  const [first, ...last] = adjFaces
  if (first.inSet(facesTosharpen)) {
    return adjFaces
  }
  return [...last, first]
}

function duplicateVertices(polyhedron: Polyhedron, facesTosharpen: Face[]) {
  const offset = polyhedron.numVertices()
  const mapping: NestedRecord<number, number, any> = {}
  polyhedron.vertices.forEach((vertex) => {
    const v = vertex.index
    const v2 = v + offset
    const values = [v, [v2, v], v2, [v, v2]]

    const faces = getShiftedAdjacentFaces(vertex, facesTosharpen)
    faces.forEach((f, i) => {
      set(mapping, [f.index, v], values[i])
    })
  })

  // Double the amount of vertices
  return polyhedron.withChanges((solid) =>
    solid.addVertices(polyhedron.vertices).mapFaces((f) => {
      return flatMapDeep(f.vertices, (v) => mapping[f.index][v.index])
    }),
  )
}

function getSharpenFaces(polyhedron: Polyhedron, faceType: number) {
  // Special octahedron case
  if (polyhedron.info.isRegular()) {
    const face0 = polyhedron.getFace()
    const adjacentFaces = face0.adjacentFaces()
    return face0.vertexAdjacentFaces().filter((f) => !f.inSet(adjacentFaces))
  }

  return polyhedron.faces.filter((f) => f.numSides === faceType)
}

function calculateSharpenDist(face: Face, edge: Edge) {
  const apothem = face.apothem()
  const theta = Math.PI - edge.dihedralAngle()
  return apothem * Math.tan(theta)
}

function getSharpenDist(polyhedron: Polyhedron, face: Face) {
  if (!polyhedron.info.isRegular() && !polyhedron.info.isQuasiRegular()) {
    return meanBy(face.edges, (edge) => calculateSharpenDist(face, edge))
  }
  return calculateSharpenDist(face, face.edges[0])
}

function getVertexToAdd(polyhedron: Polyhedron, face: Face) {
  const dist = getSharpenDist(polyhedron, face)
  return face.normalRay().getPointAtDistance(dist)
}

function applySharpen(
  polyhedron: Polyhedron,
  { faceType = polyhedron.smallestFace().numSides }: SharpenOptions = {},
) {
  // face indices with the right number of sides
  let sharpenFaces = getSharpenFaces(polyhedron, faceType)

  let mock: Polyhedron
  if (polyhedron.info.isQuasiRegular()) {
    mock = duplicateVertices(polyhedron, sharpenFaces)
    sharpenFaces = sharpenFaces.map((face) => mock.faces[face.index])
  } else {
    mock = polyhedron
  }

  const verticesToAdd = sharpenFaces.map((face) => getVertexToAdd(mock, face))

  const oldToNew: Record<number, number> = {}
  sharpenFaces.forEach((face, i) => {
    face.vertices.forEach((v) => {
      oldToNew[v.index] = i
    })
  })

  const endVertices = mock.vertices.map(
    (v, vIndex) => verticesToAdd[oldToNew[vIndex]] ?? v.vec,
  )

  return {
    animationData: {
      start: mock,
      endVertices,
    },
  }
}

interface Options {
  faceType?: number
}
export const sharpen = makeOperation<Options>("sharpen", {
  apply: applySharpen,
  optionTypes: ["faceType"],

  canApplyTo(info) {
    if (!info.isClassical()) return false
    return ["truncate", "rectify", "bevel"].includes(info.data.operation)
  },

  getResult(info, { faceType }) {
    if (!info.isClassical()) throw new Error()
    const { family, operation } = info.data
    if (operation === "truncate") return info.withData({ operation: "regular" })
    if (operation === "bevel") return info.withData({ operation: "rectify" })

    // if rectified, we have to figure out the facet from the faceType
    const facet = family === 3 ? undefined : faceType === 3 ? "face" : "vertex"
    return info.withData({ operation: "regular", facet })
  },

  hasOptions(polyhedron) {
    const info = polyhedron.info
    return (
      info.isClassical() &&
      info.data.family !== 3 &&
      info.data.operation === "rectify"
    )
  },

  allOptionCombos(polyhedron) {
    const info = polyhedron.info
    if (!info.isClassical()) throw new Error("Invalid polyhedron")
    if (info.isQuasiRegular() && !info.isRegular()) {
      return [{ faceType: 3 }, { faceType: info.data.family }]
    }
    return [{}]
  },

  hitOption: "faceType",
  getHitOption(polyhedron, hitPoint) {
    const n = polyhedron.hitFace(hitPoint).numSides
    return n <= 5 ? { faceType: n } : {}
  },

  faceSelectionStates(polyhedron, { faceType = -1 }) {
    return polyhedron.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
})
