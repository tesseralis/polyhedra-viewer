import { meanBy } from "lodash-es"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import Classical from "data/specs/Classical"
import OperationPair from "./OperationPair"
import { Vec3D } from "math/geom"

// Every unelongated capstone (except fastigium) can be elongated

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

// Get the regular face of a truncated solid
function truncatedToRegular(specs: Classical, geom: Polyhedron) {
  const sharpenFaces = getSharpenFaces(geom)
  const verticesToAdd = sharpenFaces.map((face) => getVertexToAdd(specs, face))
  const oldToNew: Record<number, number> = {}
  sharpenFaces.forEach((face, i) => {
    face.vertices.forEach((v) => {
      oldToNew[v.index] = i
    })
  })
  return geom.vertices.map(
    (v, vIndex) => verticesToAdd[oldToNew[vIndex]] ?? v.vec,
  )
}

export const truncate = new OperationPair<Classical, {}>({
  graph: Classical.query
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
    }),
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
    return truncatedToRegular(specs, geom)
  },
  toEnd({ geom }) {
    // truncated solids are already the intermediate
    return geom.vertices
  },
})

interface Options {
  facet?: "face" | "vertex"
}

export const rectify = new OperationPair<Classical, Options>({
  graph: Classical.query
    // TODO support rectified as well
    .where((data) => ["regular" /*, "rectify" */].includes(data.operation))
    .map((entry) => {
      return {
        source: entry,
        intermediate: entry.withData({
          operation: entry.isRegular() ? "truncate" : "bevel",
        }),
        target: entry.withData({
          operation: entry.isRegular() ? "rectify" : "cantellate",
        }),
        options: {
          facet: entry.data.facet,
        },
      }
    }),
  getPose({ geom, specs }, { facet }) {
    const origin = geom.centroid()
    // FIXME deduplicate these poses
    if (specs.isRegular()) {
      const face = geom.getFace()
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: geom.getVertex().vec.distanceTo(origin),
        orientation: [face.normal(), crossAxis],
      }
    }
    // Pose for intermediate polyhedron
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
    if (specs.isRectified()) {
      // pick a face that *isn't* the sharpen face type
      const face = geom.faces.find(
        (face) =>
          face.numSides === (facet === "vertex" ? 3 : specs.data.family),
      )!
      const crossAxis = face.vertices[0].vec.sub(face.centroid())
      return {
        origin,
        // scale with respect to the sharpen face
        scale: getVertexToAdd(
          specs,
          geom.faceWithNumSides(facet === "vertex" ? specs.data.family : 3),
        ).distanceTo(origin),
        orientation: [face.normal(), crossAxis],
      }
    }
    throw new Error("Not supported")
  },
  toStart({ geom, specs }) {
    return truncatedToRegular(specs, geom)
  },
  toEnd({ geom }) {
    const oldToNew: Record<number, Vec3D> = {}
    // Map each original edge to its midpoint
    for (const edge of geom.edges.filter(
      (e) => e.face.numSides > 5 && e.twinFace().numSides > 5,
    )) {
      oldToNew[edge.v1.index] = edge.midpoint()
      oldToNew[edge.v2.index] = edge.midpoint()
    }
    // FIXME octahedron case
    return geom.vertices.map((v, vIndex) => oldToNew[vIndex])
  },
})
