import { Composite } from "specs"
import { makeOpPair } from "../operationPairs"
import { getCentroid } from "math/geom"
import { find } from "lib/utils"

export default makeOpPair<Composite>({
  graph: function* () {
    for (const entry of Composite.query.where(
      (s) =>
        s.isAugmentedClassical() &&
        s.isAugmented() && // exclude the wrapper solids
        s.data.source.isClassical() &&
        s.data.source.isRegular(),
    )) {
      yield {
        left: entry,
        right: entry.withData({
          source: entry.sourceClassical().withOperation("truncate"),
        }),
      }
    }
  },
  intermediate: "right",
  getPose(forme) {
    const { specs } = forme
    const caps = forme.caps()
    // Calculate the centroid *only* for the source polyhedra
    const centroid = forme.sourceCentroid()
    const cap = caps[0]
    const boundary = cap.boundary()

    let crossAxis
    if (specs.isTri()) {
      // Use the midpoin of the normals of the two other caps
      crossAxis = getCentroid([caps[1].normal(), caps[2].normal()])
    } else if (specs.isBi() && specs.isMeta()) {
      // If metabiaugmented, use the normal of the other cap
      crossAxis = caps[1].normal()
    } else {
      const edge = find(boundary.edges, (e) =>
        forme.isFacetFace(e.twinFace(), "face"),
      )
      crossAxis = edge.normal()
    }

    return {
      origin: centroid,
      scale: forme.facetFace("face").centroid().distanceTo(centroid),
      orientation: [cap, crossAxis],
    }
  },
  toLeft: {
    sideFacets(end) {
      return end.geom.vertices
    },
  },
})
