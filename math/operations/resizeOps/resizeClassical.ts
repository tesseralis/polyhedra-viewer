import { Classical, FacetType, twists, oppositeTwist } from "specs"
import { makeOpPair } from "../operationPairs"
import { FacetOpts, TwistOpts, Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"
import { getMorphFunction } from "../morph"

export const expand = makeOpPair<Classical, {}, FacetOpts>({
  graph: function* () {
    for (const entry of Classical.allWithOperation("regular")) {
      yield {
        left: entry,
        right: entry.withOperation("cantellate"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }
  },
  middle: "right",
  getPose(forme, options) {
    return getClassicalPose(forme, options.right.facet)
  },
  toLeft: getMorphFunction(),
})

export const snub = makeOpPair<Classical, TwistOpts, FacetOpts>({
  graph: function* () {
    for (const entry of Classical.allWithOperation("regular")) {
      for (const twist of twists) {
        yield {
          left: entry,
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          right: entry.withOperation(
            "snub",
            entry.isVertex() ? oppositeTwist(twist) : twist,
          ),
          options: { left: { twist }, right: { facet: entry.facet() } },
        }
      }
    }
  },
  middle: "right",
  getPose(forme, options) {
    return getClassicalPose(forme, options.right.facet)
  },
  toLeft: getMorphFunction(),
})

export const twist = makeOpPair<Classical, TwistOpts, {}>({
  graph: function* () {
    for (const entry of Classical.allWithOperation("cantellate")) {
      for (const twist of twists) {
        yield {
          left: entry,
          right: entry.withOperation("snub", twist),
          options: { left: { twist }, right: {} },
        }
      }
    }
  },
  middle: "right",
  getPose(forme) {
    return getClassicalPose(forme, "face")
  },
  toLeft: getMorphFunction((result) => {
    // for a twist operation, the result is a cantellated solid,
    // so track all facet-faces.
    return [...result.facetFaces("face"), ...result.facetFaces("vertex")]
  }),
})

export const dual = makeOpPair<Classical>({
  graph: function* () {
    for (const specs of Classical.query.where(
      (s) => s.isRegular() && !s.isVertex(),
    )) {
      yield { left: specs, right: specs.withData({ facet: "vertex" }) }
    }
  },
  middle: (entry) => entry.left.withOperation("cantellate"),
  getPose(forme) {
    const { geom } = forme
    if (forme.specs.isCantellated()) {
      return getDualPose(forme, "face", getCantellatedMidradius(forme))
    }
    if (forme.specs.isFace()) {
      return getDualPose(forme, "face", forme.midradius())
    }
    // for the vertex figure, pick a vertex and align it with that edge
    const vertex = geom.getVertex()
    return {
      origin: geom.centroid(),
      scale: forme.midradius(),
      orientation: [vertex, vertex.adjacentVertices()[0]],
    }
  },
  toLeft: getMorphFunction(),
  toRight: getMorphFunction(),
})

// Expansion of truncated to bevelled solids
export const semiExpand = makeOpPair<Classical, {}, FacetOpts>({
  graph: function* () {
    for (const entry of Classical.allWithOperation("truncate")) {
      yield {
        left: entry,
        right: entry.withOperation("bevel"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }
  },
  middle: "right",
  getPose(forme, options) {
    return getClassicalPose(forme, options.right.facet)
  },
  // If semi-contracting to a truncated solid,
  // use the faces corresponding to the main facet
  toLeft: getMorphFunction((end) => end.facetFaces(end.specs.facet())),
})

function getClassicalPose(forme: ClassicalForme, facet: FacetType): Pose {
  const { geom } = forme
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale: geom.edgeLength(),
    orientation: forme.adjacentFacetFaces(facet),
  }
}

function getDualPose(
  forme: ClassicalForme,
  facet: FacetType,
  scale: number,
): Pose {
  const { geom } = forme
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale,
    orientation: forme.adjacentFacetFaces(facet),
  }
}

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
}
