import { set, flatMapDeep, meanBy } from "lodash-es"

import Classical from "data/specs/Classical"
import { Polyhedron, Vertex, Face, Edge } from "math/polyhedra"
import Operation from "../Operation"

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

function getOctahedronSharpenFaces(polyhedron: Polyhedron) {
  const face0 = polyhedron.getFace()
  const adjacentFaces = face0.adjacentFaces()
  return face0.vertexAdjacentFaces().filter((f) => !f.inSet(adjacentFaces))
}

function getSharpenFaces(polyhedron: Polyhedron, faceType: number) {
  return polyhedron.faces.filter((f) => f.numSides === faceType)
}

function calculateSharpenDist(face: Face, edge: Edge) {
  const apothem = face.apothem()
  const theta = Math.PI - edge.dihedralAngle()
  return apothem * Math.tan(theta)
}

function getSharpenDist(info: Classical, face: Face) {
  if (info.isBevelled()) {
    return meanBy(face.edges, (edge) => calculateSharpenDist(face, edge))
  }
  return calculateSharpenDist(face, face.edges[0])
}

function getVertexToAdd(info: Classical, face: Face) {
  const dist = getSharpenDist(info, face)
  return face.normalRay().getPointAtDistance(dist)
}

function applySharpen(
  info: Classical,
  polyhedron: Polyhedron,
  faceType: number = polyhedron.smallestFace().numSides,
) {
  // face indices with the right number of sides
  let sharpenFaces =
    info.isRectified() && info.isTetrahedral()
      ? getOctahedronSharpenFaces(polyhedron)
      : getSharpenFaces(polyhedron, faceType)

  let mock: Polyhedron
  if (info.isRectified()) {
    mock = duplicateVertices(polyhedron, sharpenFaces)
    sharpenFaces = sharpenFaces.map((face) => mock.faces[face.index])
  } else {
    mock = polyhedron
  }

  const verticesToAdd = sharpenFaces.map((face) => getVertexToAdd(info, face))

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
export const sharpen = new Operation<Options, Classical>("sharpen", {
  apply({ specs, geom }, { faceType }) {
    return applySharpen(specs, geom, faceType)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return ["truncate", "rectify", "bevel"].includes(info.data.operation)
  },

  getResult({ specs }, { faceType }) {
    if (specs.isTruncated()) return specs.withData({ operation: "regular" })
    if (specs.isBevelled()) return specs.withData({ operation: "rectify" })

    // if rectified, we have to figure out the facet from the faceType
    return specs.withData({
      operation: "regular",
      facet: faceType === 3 ? "face" : "vertex",
    })
  },

  hasOptions(info) {
    return !info.isTetrahedral() && info.isRectified()
  },

  *allOptionCombos({ specs }) {
    if (specs.isRectified() && !specs.isTetrahedral()) {
      yield { faceType: 3 }
      yield { faceType: specs.data.family }
    } else {
      yield {}
    }
  },

  hitOption: "faceType",
  getHitOption({ geom }, hitPoint) {
    const n = geom.hitFace(hitPoint).numSides
    return n <= 5 ? { faceType: n } : {}
  },

  faceSelectionStates({ geom }, { faceType = -1 }) {
    return geom.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
})
