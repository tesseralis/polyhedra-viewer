import { createForme } from "math/formes"
import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { getGeometry } from "../operationUtils"
import { rawTruncate } from "./truncateHelpers"
import { CapstoneForme } from "math/formes"

export const rectify = makeOpPair<Capstone>({
  graph: function* () {
    for (const entry of Capstone.query.where(
      (c) => c.isPyramid() && c.isMono() && c.isShortened(),
    )) {
      yield {
        left: entry,
        right: entry.withData({ elongation: "antiprism", count: 0 }),
      }
    }
  },
  intermediate(entry) {
    return new TruncatedPyramidForme(
      entry.left,
      rawTruncate(getGeometry(entry.left)),
    )
  },
  getPose(forme, $, side) {
    return {
      origin: forme.origin(),
      scale: forme.ends()[0].distanceToCenter(),
      orientation: forme.orientation(),
    }
  },
  //   toLeft: getMorphFunction(),
  //   toRight: getMorphFunction(),
})

class TruncatedPyramidForme extends CapstoneForme {
  orientation() {
    const top = this.endBoundaries()[0]
    return [top, top.edges.find((e) => e.twinFace().numSides !== 3)!] as const
  }

  *queryTops() {
    const n = this.geom.largestFace().numSides
    if (n === 6) {
      const face = this.geom.largestFace()
      const opposite = this.geom.faces.find((f) => f.isInverse(face))!
      yield face
      yield opposite
    }
    yield* this.geom.facesWithNumSides(n)
  }
}
