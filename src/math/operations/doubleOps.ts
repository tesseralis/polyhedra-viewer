import { Capstone } from "specs"
import { makeOpPair } from "./operationPairs"
import { makeOperation } from "./Operation"
// import { getTransformedVertices } from "./operationUtils"

const _double = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (s) => s.isPrimary() && !s.isGyroelongated() && !s.isSnub(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ type: "secondary", gyrate: "ortho" }),
      }
    }
  },
  middle: "right",
  getPose(forme) {
    // Make sure the pyramid is facing up and pick a side
    const cap = forme.endCaps()[0]
    const crossAxis = forme.specs.isPyramid()
      ? cap.boundary().edges[0]
      : cap.boundary().edges.find((e) => e.face.numSides === 3)!
    return {
      scale: forme.geom.edgeLength(),
      origin: forme.centroid(),
      orientation: [cap.normal(), crossAxis],
    }
  },
  toLeft(forme) {
    return forme.geom.vertices
  },
})

export const double = makeOperation("double", _double.left)
export const halve = makeOperation("halve", _double.right)
