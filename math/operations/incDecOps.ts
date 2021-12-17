import { Capstone } from "specs"
import { makeOpPair } from "./operationPairs"
import { Cap, Face } from "math/polyhedra"
import { CapstoneForme } from "math/formes"
import { getResizeFunction } from "./resizeOps/resizeUtils"
import { makeOperation } from "./Operation"

const getResizedVertices = getResizeFunction(getFacesToMap)

const incDec = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) =>
        c.isPrimary() &&
        !c.isPentagonal() &&
        !c.isGyroelongated() &&
        !c.isSnub(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ base: (entry.data.base + 1) as any }),
      }
    }
    // Expand the pentagonal prism to the hexagonal prism
    yield {
      left: Capstone.query.withData({
        base: 5,
        type: "primary",
        count: 0,
        elongation: "prism",
        rotundaCount: 0,
      }),
      right: Capstone.query.withData({
        base: 3,
        type: "secondary",
        count: 0,
        elongation: "prism",
        rotundaCount: 0,
      }),
    }
  },
  middle: "right",
  getPose(forme) {
    const top = forme.ends()[0]
    const crossAxis =
      top instanceof Cap ? top.boundary().edges[0] : (top as Face).edges[0]
    return {
      // TODO should be base center
      origin: forme.centroid(),
      scale: forme.geom.edgeLength(),
      orientation: [top, crossAxis],
    }
  },
  toLeft: getResizedVertices,
})

function getFacesToMap(result: CapstoneForme) {
  if (result.specs.isBi()) {
    return result.geom.faces
  }
  if (result.specs.isMono()) {
    const cap = result.caps()[0]
    if (result.specs.isElongated()) {
      // For elongated mono, include everything but the bottom cap
      return cap.boundary().edges.flatMap((e) => {
        return [e.face, e.twinFace()]
      })
    }
    // For pure pyramids, return all the faces of the cap
    return cap.faces()
  }
  // Otherwise, it's a prism, so return the side faces
  const end = result.ends()[0] as Face
  return end.adjacentFaces()
}

export const increment = makeOperation("increment", incDec.left)
export const decrement = makeOperation("decrement", incDec.right)
