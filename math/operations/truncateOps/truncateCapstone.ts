import { createForme } from "math/formes"
import { Capstone } from "specs"
import { getMorphFunction } from "../morph"
import { makeOpPair } from "../operationPairs"
import { getGeometry } from "../operationUtils"
import { rawTruncate } from "./truncateHelpers"

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
    return createForme(entry.left, rawTruncate(getGeometry(entry.left)))
  },
  getPose(forme, $, side) {
    if (side !== "intermediate") {
      return {
        origin: forme.origin(),
        scale: forme.geom.faces[0].distanceToCenter(),
        orientation: forme.orientation(),
      }
    }
    return {
      origin: forme.geom.centroid(),
      scale: forme.geom.faces[0].distanceToCenter(),
      // just do randomly for now
      orientation: [forme.geom.faces[0], forme.geom.faces[1]],
    }
  },
  //   toLeft: getMorphFunction(),
  //   toRight: getMorphFunction(),
})
