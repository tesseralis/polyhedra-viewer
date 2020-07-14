import { sortBy } from "lodash-es"
import { Polyhedron, Cap } from "math/polyhedra"
import Capstone from "data/specs/Capstone"
import OperationPair from "./OperationPair"

// Every unelongated capstone (except fastigium) can be elongated
const graph = Capstone.query
  .where((data) => !data.elongation && data.base > 2)
  .map((entry) => {
    const target = entry.withData({ elongation: "prism" })
    return {
      source: entry,
      intermediate: target,
      target,
    }
  })

const capTypeMap: Record<string, number> = { rotunda: 0, cupola: 1, pyramid: 2 }

export const elongate = new OperationPair<Capstone, {}>({
  graph,
  getPose({ geom, specs }) {
    // Pick a cap, favoring rotunda over cupola in the case of cupolarotundae
    const cap = sortBy(Cap.getAll(geom), (cap) => capTypeMap[cap.type])[0]
    const capBoundary = cap.boundary()
    const capCenter = capBoundary.centroid()
    // If elongated, get subtract half the side length to make it the center of the prism
    const origin = specs.isElongated()
      ? capCenter.sub(capBoundary.normal().scale(geom.edges[0].length() / 2))
      : capCenter

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
  toStart({ geom }) {
    // Shorten the solid
    // FIXME get the cap that we are aligned with and its opposite cap
    // push the caps inwards
    return geom
  },
  toEnd({ geom }) {
    // Elongated solids are already the intermediate
    return geom
  },
})
