import { Capstone } from "specs"
import { makeOpPair } from "../operationPairs"
import { getGeometry } from "../operationUtils"
import { rawTruncate } from "./truncateHelpers"
import { CapstoneForme } from "math/formes"
import { Face } from "math/polyhedra"
import { CapstoneFace } from "math/formes/FaceType"

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
  toLeft: {
    sideFacets: (forme) => forme.geom.vertices,
  },
  toRight: {
    sideFacets: (forme) => [
      forme.ends()[0] as Face,
      ...forme.endBoundaries()[1].adjacentFaces(),
    ],
  },
})

class TruncatedPyramidForme extends CapstoneForme {
  orientation() {
    const top = this.endBoundaries()[0]
    return [top, top.edges.find((e) => e.twinFace().numSides !== 3)!] as const
  }

  *queryTops() {
    yield* this.geom.facesWithNumSides(this.specs.data.base)
  }

  *queryBottoms() {
    yield* this.geom.facesWithNumSides(this.specs.data.base * 2)
  }

  faceAppearance(face: Face) {
    return CapstoneFace.capTop(this.specs.data.base)
  }
}
