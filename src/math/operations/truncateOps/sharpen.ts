import { set, flatMapDeep } from "lodash-es"

import Classical from "data/specs/Classical"
import { Polyhedron, Vertex, Face, Edge } from "math/polyhedra"
import Operation from "../Operation"
import metaTruncate from "../../operations-new/truncate"

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

function getSharpenDist(face: Face) {
  return calculateSharpenDist(face, face.edges[0])
}

function getVertexToAdd(face: Face) {
  const dist = getSharpenDist(face)
  return face.normalRay().getPointAtDistance(dist)
}

function applyUnrectify(
  info: Classical,
  polyhedron: Polyhedron,
  faceType: number = polyhedron.smallestFace().numSides,
) {
  // face indices with the right number of sides
  let sharpenFaces = info.isTetrahedral()
    ? getOctahedronSharpenFaces(polyhedron)
    : getSharpenFaces(polyhedron, faceType)

  const mock = duplicateVertices(polyhedron, sharpenFaces)
  sharpenFaces = sharpenFaces.map((face) => mock.faces[face.index])

  const verticesToAdd = sharpenFaces.map((face) => getVertexToAdd(face))

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
    if (!specs.isRectified()) {
      return metaTruncate.unapply(geom)
    }
    return applyUnrectify(specs, geom, faceType)
  },

  canApplyTo(info): info is Classical {
    if (metaTruncate.canUnapplyTo(info)) return true
    if (!info.isClassical()) return false
    return info.isRectified()
  },

  getResult({ specs }, { faceType }) {
    if (specs.isRectified()) {
      // if rectified, we have to figure out the facet from the faceType
      return specs.withData({
        operation: "regular",
        facet: faceType === 3 ? "face" : "vertex",
      })
    } else {
      return metaTruncate.getSource(specs)
    }
  },

  hasOptions(info) {
    if (metaTruncate.canUnapplyTo(info)) return false
    return !info.isTetrahedral() && info.isRectified()
  },

  *allOptionCombos({ specs }) {
    if (metaTruncate.canUnapplyTo(specs)) {
      yield {}
    } else if (specs.isRectified() && !specs.isTetrahedral()) {
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
