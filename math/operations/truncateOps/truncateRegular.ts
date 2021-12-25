import { FacetType } from "specs"
import { ClassicalForme } from "math/formes"
import { Pose } from "../operationUtils"
import { makeTruncateTrio } from "./truncateHelpers"

/**
 * Describes the truncation operations on a Platonic solid.
 */
export default makeTruncateTrio(
  (forme, options) => getRegularPose(forme, options?.right?.facet),
  {
    left: {
      operation: "regular",
      transformer: { sideFacets: (forme) => forme.geom.vertices },
    },
    middle: { operation: "truncate" },
    right: {
      operation: "rectify",
      // The rectified version is the only thing we need to choose an option for
      // when we move out of it
      options: (entry) => ({ facet: entry.facet() }),
      transformer: {
        sideFacets(endForme, start) {
          return endForme.facetFaces(
            start.specs.facet() === "face" ? "vertex" : "face",
          )
        },
      },
    },
  },
)

function getRegularPose(
  forme: ClassicalForme,
  facet: FacetType = forme.specs.facet(),
): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: forme.facetFace(facet).distanceToCenter(),
    orientation: forme.adjacentFacetFaces(facet),
  }
}
