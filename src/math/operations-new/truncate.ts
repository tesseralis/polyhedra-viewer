import { meanBy } from "lodash-es"
import { Polyhedron, Face, Edge } from "math/polyhedra"
import Classical, { Facet } from "data/specs/Classical"
import OperationPair, { Pose } from "./OperationPair"
import { getTransformedVertices } from "../operations/operationUtils"

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

function regularPose(geom: Polyhedron): Pose {
  const origin = geom.centroid()
  const face = geom.getFace()
  const crossAxis = face.edges[0].midpoint().sub(face.centroid())
  return {
    origin,
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossAxis],
  }
}

function truncatedPose(geom: Polyhedron): Pose {
  const origin = geom.centroid()
  const face = geom.largestFace()
  const n = face.numSides
  const edge = face.edges.find((e) => e.twinFace().numSides === n)!
  const crossAxis = edge.midpoint().sub(face.centroid())
  return {
    origin,
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossAxis],
  }
}

function rectifiedPose(
  specs: Classical,
  geom: Polyhedron,
  facet?: Facet,
): Pose {
  const origin = geom.centroid()
  // pick a face that *isn't* the sharpen face type
  const faceType = facet === "vertex" ? 3 : specs.data.family
  const face = geom.faces.find((face) => face.numSides === faceType)!
  const crossAxis = face.vertices[0].vec.sub(face.centroid())
  return {
    origin,
    // scale with respect to the sharpen face
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossAxis],
  }
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

function truncatedToRectified(geom: Polyhedron) {
  const edges = geom.edges.filter(
    (e) => e.face.numSides > 5 && e.twinFace().numSides > 5,
  )
  return getTransformedVertices(edges, (e) => e.midpoint())
}

export const amboTruncate = new OperationPair<Classical>({
  graph: Classical.query
    .where((data) => data.operation === "rectify")
    .map((entry) => ({
      left: entry,
      right: entry.withData({ operation: "bevel" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    const origin = geom.centroid()
    if (side === "left") {
      const face = geom.faceWithNumSides(specs.data.family)
      const crossAxis = face.edges[0].midpoint().sub(face.centroid())
      return {
        origin,
        scale: geom.getVertex().distanceToCenter(),
        orientation: [face.normal(), crossAxis],
      }
    } else {
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
  },
  toLeft: ({ geom, specs }) => truncatedToRegular(specs, geom),
  toRight: ({ geom }) => geom.vertices,
})

export const truncate = new OperationPair<Classical>({
  graph: Classical.query
    .where((data) => data.operation === "regular")
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ operation: "truncate" }),
      }
    }),
  getIntermediate: (entry) => entry.right,
  getPose: (side, { geom }) =>
    side === "left" ? regularPose(geom) : truncatedPose(geom),
  toLeft: ({ geom, specs }) => truncatedToRegular(specs, geom),
  toRight: ({ geom }) => geom.vertices,
})

interface Options {
  facet?: "face" | "vertex"
}

export const cotruncate = new OperationPair<Classical, {}, Options>({
  graph: Classical.query
    .where((data) => data.operation === "truncate")
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ operation: "rectify" }),
        rightOpts: { facet: entry.data.facet },
      }
    }),
  getIntermediate: (entry) => entry.left,
  getPose: (side, { specs, geom }, { facet }) =>
    side === "right" ? rectifiedPose(specs, geom, facet) : truncatedPose(geom),
  toLeft: ({ geom }) => geom.vertices,
  toRight: ({ geom }) => truncatedToRectified(geom),
})

// TODO support double rectification
export const rectify = new OperationPair<Classical, {}, Options>({
  graph: Classical.query
    .where((data) => ["regular"].includes(data.operation))
    .map((entry) => ({
      left: entry,
      right: entry.withData({ operation: "rectify" }),
      rightOpts: { facet: entry.data.facet },
    })),
  getIntermediate: ({ left }) => left.withData({ operation: "truncate" }),
  getPose(side, { geom, specs }, { facet }) {
    switch (side) {
      case "left":
        return regularPose(geom)
      case "middle":
        return truncatedPose(geom)
      case "right":
        return rectifiedPose(specs, geom, facet)
    }
  },
  toLeft: ({ geom, specs }) => truncatedToRegular(specs, geom),
  toRight: (solid) => truncatedToRectified(solid.geom),
})
