import { sortBy } from "lodash-es"
import { Cap } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import OperationPair from "./OperationPair"
import {
  getAdjustInformation,
  getScaledPrismVertices,
} from "../operations/prismOps/prismUtils"

const capTypeMap: Record<string, number> = { rotunda: 0, cupola: 1, pyramid: 2 }

export default new OperationPair<Capstone, {}>({
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
  getPose(side, { geom, specs }) {
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
