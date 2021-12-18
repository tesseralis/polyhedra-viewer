import { Classical, FacetType, twists, oppositeTwist } from "specs"
import { makeOpPair, OpPairInput, GraphOpts } from "../operationPairs"
import { FacetOpts, TwistOpts, Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"
import { getMorphFunction } from "../morph"

const getResizedVertices = getMorphFunction(getFacesToMap)

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

type ResizeArgs<L, R> = Omit<OpPairInput<Classical, L, R>, "graph">

function getResizeArgs<L, R>(
  getFacet: (opts: GraphOpts<L, R>) => FacetType,
): ResizeArgs<L, R> {
  return {
    middle: "right",
    getPose(forme, options) {
      return getClassicalPose(forme, getFacet(options))
    },
    toLeft: getResizedVertices,
  }
}

const resizeArgs = getResizeArgs<{}, FacetOpts>((opts) => opts.right.facet)

// Expansion of truncated to bevelled solids
export const semiExpand = makeOpPair<Classical, {}, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Classical.allWithOperation("truncate")) {
      yield {
        left: entry,
        right: entry.withOperation("bevel"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }
  },
})

export const expand = makeOpPair<Classical, {}, FacetOpts>({
  ...resizeArgs,
  graph: function* () {
    for (const entry of Classical.allWithOperation("regular")) {
      yield {
        left: entry,
        right: entry.withOperation("cantellate"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }
  },
})

export const snub = makeOpPair<Classical, TwistOpts, FacetOpts>({
  ...resizeArgs,
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
})

export const twist = makeOpPair<Classical, TwistOpts, {}>({
  ...getResizeArgs(() => "face"),
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
  toLeft: getResizedVertices,
  toRight: getResizedVertices,
})

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
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

// get the result faces to map the start faces too
function getFacesToMap(result: ClassicalForme) {
  // If contracting to a regular solid, use all faces
  if (result.specs.isRegular()) {
    return result.geom.faces
  }
  // If semi-contracting to a truncated solid,
  // use the faces corresponding to the main facet
  if (result.specs.isTruncated()) {
    return result.facetFaces(result.specs.facet())
  }
  // for a twist operation, the result is a cantellated solid,
  // so return all facet-faces.
  return [...result.facetFaces("face"), ...result.facetFaces("vertex")]
}
