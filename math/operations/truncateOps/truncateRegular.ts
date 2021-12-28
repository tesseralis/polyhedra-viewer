import { Twist, Classical, FacetType, twists } from "specs"
import { ClassicalForme, fromSpecs } from "math/formes"
import { Pose, TwistOpts } from "../operationUtils"
import { makeTruncateTrio, rawTruncate } from "./truncateHelpers"
import { makeOpPair } from "../operationPairs"
import { Face } from "math/polyhedra"

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

export const alternateBevelled = makeOpPair<Classical, TwistOpts, {}>({
  graph: function* () {
    for (const entry of Classical.query.where((e) => e.isBevelled())) {
      for (const twist of twists) {
        yield {
          left: entry,
          right: entry.withOperation("snub", twist),
          options: { left: { twist }, right: {} },
        }
      }
    }
  },
  intermediate(entry) {
    const leftForme = fromSpecs(entry.left)
    return new AlternatedBevelledForme(
      entry.right,
      rawTruncate(
        leftForme.geom,
        getAlternateVertices(leftForme, entry.options!.left.twist),
      ),
    )
  },
  getPose(forme) {
    return {
      origin: forme.origin(),
      scale: Math.max(...forme.geom.vertices.map((v) => v.distanceToCenter())),
      orientation: forme.orientation(),
    }
  },
  toLeft: {
    sideFacets: (forme) => getAlternateVertices(forme, forme.specs.data.twist!),
  },
  toRight: {
    sideFacets: (forme) => forme.edgeFaces(),
  },
})

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

class AlternatedBevelledForme extends ClassicalForme {
  adjacentFacetFace(face: Face, facet: "face" | "vertex") {
    const edge = face.edges.find((e) => this.isEdgeFace(e.twinFace()))!
    // The alternated edge face has six sides
    return edge.twin().next().next().next().twinFace()
  }

  protected _getFacet(face: Face) {
    if (face.numSides === this.specs.data.family * 3) {
      return "face"
    }
    if (face.numSides === 9) {
      return "vertex"
    }
    return null
  }

  protected tetrahedralFacetFaces(facet: "face" | "vertex") {
    const numSides = this.specs.data.family * 3
    let f0 = this.geom.faceWithNumSides(numSides)
    if (facet === "vertex") {
      f0 = f0.adjacentFaces().find((f) => f.numSides === numSides)!
    }
    const rest = f0.edges
      .filter((e) => e.twinFace().numSides === 6)
      .map((edge) => edge.twin().next().next().next().twinFace())

    return [f0, ...rest]
  }
}

function getAlternateVertices(forme: ClassicalForme, twist: Twist) {
  return forme.geom.vertices.filter((v) => {
    const adjFaceTypes = v.adjacentFaces().map((f) => forme.getFacet(f))
    const vertIndex = adjFaceTypes.findIndex((type) => type === "vertex")
    const faceIndex = adjFaceTypes.findIndex((type) => type === "face")
    return twist === "left"
      ? vertIndex === (faceIndex + 1) % 3
      : faceIndex === (vertIndex + 1) % 3
  })
}
