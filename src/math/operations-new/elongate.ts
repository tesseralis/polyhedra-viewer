import { sortBy } from "lodash-es"
import { Twist } from "types"
import { Cap } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import OperationPair from "./OperationPair"
import {
  getAdjustInformation,
  getScaledPrismVertices,
  antiprismHeight,
} from "../operations/prismOps/prismUtils"

const capTypeMap: Record<string, number> = { rotunda: 0, cupola: 1, pyramid: 2 }

// FIXME deduplicate with other options
interface TwistOpts {
  twist?: Twist
}

export const elongate = new OperationPair<Capstone>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Capstone.query
    .where((data) => !data.elongation && data.base > 2)
    .map((entry) => {
      return {
        left: entry,
        right: entry.withData({ elongation: "prism" }),
      }
    }),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const cap = sortBy(Cap.getAll(geom), (cap) => capTypeMap[cap.type])[0]
    const capBoundary = cap.boundary()
    const capCenter = capBoundary.centroid()
    // If elongated, get subtract half the side length to make it the center of the prism
    const origin =
      side === "left"
        ? capCenter
        : capCenter.sub(capBoundary.normal().scale(geom.edges[0].length() / 2))

    // For the cross-axis, pick an edge connected to a triangle for consistency
    // FIXME need to adjust a bit by the angle...
    const edge = capBoundary.edges.find((e) => e.face.numSides === 3)!
    return {
      origin,
      scale: capBoundary.sideLength(),
      orientation: [
        // For orientation, use the normal and one of the vertices on the boundary
        capBoundary.normal(),
        edge.v1.vec.sub(capCenter),
      ] as const,
    }
  },
  toLeft({ geom }) {
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const scale = geom.edgeLength()

    return getScaledPrismVertices(adjustInfo, -scale)
  },
  toRight({ geom }) {
    // Elongated solids are already the intermediate
    return geom.vertices
  },
})

export const gyroelongPyramid = new OperationPair<Capstone>({
  // Every unelongated capstone (except fastigium) can be elongated
  graph: Capstone.query
    .where(
      (data) =>
        data.type === "pyramid" &&
        data.count === 1 &&
        !data.elongation &&
        data.base > 3,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom, specs }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    // FIXME pick the right cap for diminished icosahedron
    // const cap = sortBy(Cap.getAll(geom), (cap) => capTypeMap[cap.type])[0]
    const face = geom.largestFace()
    const capCenter = face.centroid()
    const n = face.numSides
    const angle = Math.PI / n / 2
    // If gyroelongated, get subtract half the antiprism side length to make it the center
    const antiHeight = antiprismHeight(n)
    const edge = face.edges.find((e) => e.twinFace().numSides === 3)!
    if (side === "left") {
      const origin = capCenter
      return {
        origin,
        scale: geom.edgeLength(),
        orientation: [
          // For orientation, use the normal and one of the vertices on the boundary
          face.normal(),
          edge.v1.vec.sub(capCenter),
        ] as const,
      }
    } else {
      const origin = capCenter.sub(
        face.normal().scale((antiHeight * geom.edges[0].length()) / 2),
      )
      // For the cross-axis, pick an edge connected to a triangle for consistency
      const crossAxis = edge.v1.vec.sub(capCenter)
      return {
        origin,
        scale: geom.edgeLength(),
        orientation: [
          // For orientation, use the normal and one of the vertices on the boundary
          face.normal(),
          crossAxis.getRotatedAroundAxis(face.normal(), angle),
        ] as const,
      }
    }
  },
  toLeft({ geom }) {
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, "left")
  },
  toRight({ geom }) {
    // Elongated solids are already the intermediate
    return geom.vertices
  },
})

export const gyroelongCupola = new OperationPair<Capstone>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type !== "pyramid" &&
        data.count === 1 &&
        data.base > 2 &&
        !data.elongation,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    // FIXME pick the right cap for diminished icosahedron
    const cap = Cap.getAll(geom)[0]
    const capBoundary = cap.boundary()
    const capCenter = capBoundary.centroid()
    // If gyroelongated, get subtract half the antiprism side length to make it the center
    const antiHeight = antiprismHeight(capBoundary.numSides)
    const n = capBoundary.numSides
    const angle = Math.PI / n / 2
    // For the cross-axis, pick an edge connected to a triangle for consistency
    const edge = capBoundary.edges.find((e) => e.face.numSides === 3)!
    if (side === "left") {
      const origin = capCenter
      return {
        origin,
        scale: geom.edgeLength(),
        orientation: [
          // For orientation, use the normal and one of the vertices on the boundary
          capBoundary.normal(),
          edge.v1.vec.sub(capCenter),
        ] as const,
      }
    } else {
      const origin = capCenter.sub(
        capBoundary.normal().scale((antiHeight * geom.edges[0].length()) / 2),
      )
      // For the cross-axis, pick an edge connected to a triangle for consistency
      const crossAxis = edge.v1.vec.sub(capCenter)
      return {
        origin,
        scale: geom.edgeLength(),
        orientation: [
          // For orientation, use the normal and one of the vertices on the boundary
          capBoundary.normal(),
          crossAxis.getRotatedAroundAxis(capBoundary.normal(), angle),
        ] as const,
      }
    }
  },
  toLeft({ geom }) {
    // return geom.vertices
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, "left")
  },
  toRight: (solid) => solid.geom.vertices,
})

export const gyroelongBipyramid = new OperationPair<Capstone>({
  graph: Capstone.query
    .where(
      (data) =>
        data.type === "pyramid" &&
        data.count === 2 &&
        data.base > 3 &&
        !data.elongation,
    )
    .map((entry) => ({
      left: entry,
      right: entry.withData({ elongation: "antiprism" }),
    })),
  getIntermediate: (entry) => entry.right,
  getPose(side, { geom }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    // FIXME pick the right cap for diminished icosahedron
    const cap = Cap.getAll(geom)[0]
    const capBoundary = cap.boundary()
    const capCenter = capBoundary.centroid()
    // If gyroelongated, get subtract half the antiprism side length to make it the center
    const antiHeight = antiprismHeight(capBoundary.numSides)
    const n = capBoundary.numSides
    const angle = Math.PI / n / 2
    // For the cross-axis, pick an edge connected to a triangle for consistency
    const edge = capBoundary.edges.find((e) => e.face.numSides === 3)!
    if (side === "left") {
      const origin = capCenter
      return {
        origin,
        scale: geom.edgeLength(),
        orientation: [
          // For orientation, use the normal and one of the vertices on the boundary
          capBoundary.normal(),
          edge.v1.vec.sub(capCenter),
        ] as const,
      }
    } else {
      const origin = capCenter.sub(
        capBoundary.normal().scale((antiHeight * geom.edges[0].length()) / 2),
      )
      // For the cross-axis, pick an edge connected to a triangle for consistency
      const crossAxis = edge.v1.vec.sub(capCenter)
      return {
        origin,
        scale: geom.edgeLength(),
        orientation: [
          // For orientation, use the normal and one of the vertices on the boundary
          capBoundary.normal(),
          crossAxis.getRotatedAroundAxis(capBoundary.normal(), angle),
        ] as const,
      }
    }
  },
  toLeft({ geom }) {
    // return geom.vertices
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    const adjustInfo = getAdjustInformation(geom)
    const n = adjustInfo.boundary.numSides
    const scale = geom.edgeLength() * antiprismHeight(n)

    return getScaledPrismVertices(adjustInfo, -scale, "left")
  },
  toRight: (solid) => solid.geom.vertices,
})
