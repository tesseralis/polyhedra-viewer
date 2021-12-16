import { Classical, FacetType, twists, oppositeTwist } from "specs"
import { makeOpPair, OpPairInput, GraphOpts } from "../operationPairs"
import { FacetOpts, TwistOpts, Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"
import { getResizeFunction } from "./resizeUtils"

const getResizedVertices = getResizeFunction(getFacesToMap)

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
    toLeft(forme, $, result) {
      return getResizedVertices(forme, result)
    },
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

// get the result faces to map the start faces too
function getFacesToMap(result: ClassicalForme) {
  if (result.specs.isRegular()) {
    return result.geom.faces
  }
  // for a twist operation, the "end" is a cantellated solid
  // so return all facet-faces.
  return [...result.facetFaces("face"), ...result.facetFaces("vertex")]
}
