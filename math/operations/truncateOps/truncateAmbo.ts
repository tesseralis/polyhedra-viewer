import { sum } from "lodash-es"
import { Classical, facetTypes, twists } from "specs"
import { Pose, TwistOpts } from "../operationUtils"
import { ClassicalForme } from "math/formes"
import { makeTruncateTrio } from "./truncateHelpers"
import { getMorphFunction } from "../morph"
import { makeOpPair } from "../operationPairs"

/**
 * A trio of operations that describe the truncation behavior on a quasi-regular polyhedron
 * (tetratetrahedron, cuboctahedron, and icosidodecahedron).
 */
export default makeTruncateTrio(getAmboPose, {
  left: {
    operation: "rectify",
    // When morphing back to a rectified solid, track the vertices
    transformer: getMorphFunction((end) => end.geom.vertices),
  },
  middle: { operation: "bevel" },
  right: {
    operation: "cantellate",
    // For morphing into a cantellated solid, track the edge faces
    transformer: getMorphFunction((end) => end.edgeFaces()),
  },
})

export const semisnubAmbo = makeOpPair<Classical, TwistOpts>({
  graph: function* () {
    for (const entry of Classical.allWithOperation("rectify")) {
      for (const twist of twists) {
        yield {
          left: entry,
          right: entry.withOperation("snub", twist),
          options: { left: { twist } } as any,
        }
      }
    }
  },
  intermediate: "right",
  getPose: getAmboPose,
  // Using the default parameters (end result faces) works for semisnub
  toLeft: getMorphFunction(),
})

function getAmboPose(forme: ClassicalForme): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: avgInradius(forme),
    orientation: forme.adjacentFacetFaces("face"),
  }
}

function avgInradius(forme: ClassicalForme) {
  return sum(facetTypes.map((f) => forme.inradius(f))) / facetTypes.length
}
