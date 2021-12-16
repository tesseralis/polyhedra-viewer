import { minBy, range } from "lodash-es"
import { getCyclic } from "lib/utils"
import { Classical, FacetType, twists, oppositeTwist } from "specs"
import { makeOpPair, OpPairInput, GraphOpts } from "../operationPairs"
import { FacetOpts, TwistOpts, Pose } from "../operationUtils"
import { isCodirectional } from "math/geom"
import { Vertex, Face } from "math/polyhedra"
import { ClassicalForme } from "math/formes"

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param faces the faces to transform
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(forme: ClassicalForme, result: ClassicalForme) {
  // FIXME deduplicate with `resizePyramid`
  // (everything is the same)
  const isSnub = forme.specs.isSnub()
  const facePairs = getFacePairs(
    forme.geom.faces,
    getFacesToMap(result),
    isSnub,
  )

  // create a map from the initial vertices to the end vertices
  const mapping: Vertex[] = []
  for (const [f1, f2] of facePairs) {
    for (const [v1, v2] of getVertexPairs(f1, f2, isSnub)) {
      mapping[v1.index] = v2
    }
  }
  const res = forme.geom.vertices.map((v) => {
    return mapping[v.index]
  })
  return res
}

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

// Find the faces in the first set that map onto the second set
function getFacePairs(first: Face[], second: Face[], isSnub?: boolean) {
  return second.map((face) => {
    return [findFacePartner(face, first, isSnub), face]
  })
}

function findFacePartner(face: Face, candidates: Face[], isSnub?: boolean) {
  if (isSnub) {
    return minBy(candidates, (face2) => {
      return face.normal().angleTo(face2.normal())
    })!
  } else {
    const partner = candidates.find((face2) =>
      isCodirectional(face.normal(), face2.normal()),
    )
    if (!partner) {
      throw new Error("Something went wrong finding a partner face")
    }
    return partner
  }
}

function getVertexPairs(f1: Face, f2: Face, isSnub?: boolean) {
  const partnerIndex = getPartnerVertexIndex(f1, f2, isSnub)
  return f1.vertices.map((v, i) => {
    return [v, getCyclic(f2.vertices, i + partnerIndex)] as [Vertex, Vertex]
  })
}

function getPartnerVertexIndex(f1: Face, f2: Face, isSnub?: boolean) {
  const v0 = f1.vertices[0]
  if (isSnub) {
    // snub vertices aren't aligned, so get the closest one
    return minBy(range(0, f2.numSides), (i) => {
      const v = f2.vertices[i]
      return f1
        .centroid()
        .clone()
        .sub(v0.vec)
        .angleTo(f2.centroid().clone().sub(v.vec))
    })!
  }
  const partnerIndex = f2.vertices.findIndex((v) =>
    isCodirectional(
      f1.centroid().clone().sub(v0.vec),
      f2.centroid().clone().sub(v.vec),
    ),
  )
  if (partnerIndex < 0) {
    throw new Error("Something went wrong finding a partner vertex")
  }
  return partnerIndex
}
