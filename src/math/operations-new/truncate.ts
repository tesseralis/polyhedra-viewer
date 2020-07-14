import { meanBy } from "lodash-es"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import Classical from "data/specs/Classical"
import OperationPair from "./OperationPair"

// Every unelongated capstone (except fastigium) can be elongated
const graph = Classical.query
  .where((data) => ["regular", "rectify"].includes(data.operation))
  .map((entry) => {
    const target = entry.withData({
      operation: entry.isRegular() ? "truncate" : "bevel",
    })
    return {
      source: entry,
      intermediate: target,
      target,
    }
  })

function getSharpenFaces(polyhedron: Polyhedron) {
  const faceType = polyhedron.smallestFace().numSides
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

export default new OperationPair<Classical, {}>({
  graph,
  getPose({ geom, specs }) {
    const origin = geom.centroid()
    // If classical, pick any face and any vertex on that face

    if (specs.isRegular()) {
      const face = geom.getFace()
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: geom.getVertex().vec.distanceTo(origin),
        orientation: [face.normal(), crossAxis],
      }
    }
    if (specs.isRectified()) {
      const face = geom.faceWithNumSides(specs.data.family)
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: geom.getVertex().vec.distanceTo(origin),
        orientation: [face.normal(), crossAxis],
      }
    }
    if (specs.isTruncated()) {
      const face = geom.largestFace()
      const n = face.numSides
      const edge = face.edges.find((e) => e.twinFace().numSides === n)!
      const crossAxis = edge.midpoint().sub(face.centroid())
      return {
        origin,
        scale: getVertexToAdd(specs, getSharpenFaces(geom)[0]).distanceTo(
          origin,
        ),
        orientation: [face.normal(), crossAxis],
      }
    }
    if (specs.isBevelled()) {
      const face = geom.faceWithNumSides(specs.data.family * 2)
      const edge = face.edges.find((e) => e.twinFace().numSides !== 4)!
      const crossAxis = edge.midpoint().sub(face.centroid())
      return {
        origin,
        scale: getVertexToAdd(specs, getSharpenFaces(geom)[0]).distanceTo(
          origin,
        ),
        orientation: [face.normal(), crossAxis],
      }
    }
    // If rectified, pick a triangular face for ease
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    throw new Error(`Not implemented`)
  },
  toStart({ geom, specs }) {
    const sharpenFaces = getSharpenFaces(geom)
    const verticesToAdd = sharpenFaces.map((face) =>
      getVertexToAdd(specs, face),
    )
    const oldToNew: Record<number, number> = {}
    sharpenFaces.forEach((face, i) => {
      face.vertices.forEach((v) => {
        oldToNew[v.index] = i
      })
    })
    const endVertices = geom.vertices.map(
      (v, vIndex) => verticesToAdd[oldToNew[vIndex]] ?? v.vec,
    )

    return geom.withVertices(endVertices)
  },
  toEnd({ geom }) {
    // truncated solids are already the intermediate
    return geom
  },
})
