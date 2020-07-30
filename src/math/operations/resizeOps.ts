import { twists, oppositeTwist } from "types"
import Classical, { Facet, oppositeFacet } from "data/specs/Classical"
import {
  makeOpPair,
  combineOps,
  OpPairInput,
  GraphOpts,
} from "./operationPairs"
import { withOrigin } from "math/geom"
import {
  getTransformedVertices,
  FacetOpts,
  TwistOpts,
  Pose,
} from "./operationUtils"
import Operation, { makeOperation } from "./Operation"
import ClassicalForme from "math/formes/ClassicalForme"

/**
 * Return the expanded vertices of the polyhedron resized to the given distance-from-center
 * and rotated by the given angle
 *
 * @param faces the faces to transform
 * @param distance the normalized distance from center to put those faces
 * @param angle the angle to twist the faces by
 */
function getResizedVertices(
  forme: ClassicalForme,
  facet: Facet,
  result: Classical,
) {
  const resultForme = ClassicalForme.fromSpecs(result)
  const angle = forme.snubAngle(facet)
  const distance = resultForme.inradius(facet) / resultForme.geom.edgeLength()
  const scale = forme.geom.edgeLength() * distance - forme.inradius(facet)
  return getTransformedVertices(forme.facetFaces(facet), (f) =>
    withOrigin(f.centroid(), (v) =>
      v.getRotatedAroundAxis(f.normal(), angle).add(f.normal().scale(scale)),
    ),
  )
}

function getClassicalPose(forme: ClassicalForme, facet: Facet): Pose {
  const { geom } = forme
  return {
    // Always centered on centroid
    origin: geom.centroid(),
    // Use the normal of the given face as the first axis
    scale: geom.edgeLength(),
    orientation: forme
      .adjacentFacetFaces(facet)
      .map((face) => face.normal()) as any,
  }
}

type ResizeArgs<L, R> = Omit<OpPairInput<ClassicalForme, L, R>, "graph">

function getResizeArgs<L, R>(
  getFacet: (opts: GraphOpts<L, R>) => Facet,
): ResizeArgs<L, R> {
  return {
    middle: "right",
    getPose(pos, forme, options) {
      return getClassicalPose(forme, getFacet(options))
    },
    toLeft(forme, options, result) {
      return getResizedVertices(forme, getFacet(options), result)
    },
  }
}

const resizeArgs = getResizeArgs<{}, FacetOpts>((opts) => opts.right.facet)

// Expansion of truncated to bevelled solids
const semiExpand = makeOpPair<ClassicalForme, {}, FacetOpts>({
  ...resizeArgs,
  graph: Classical.query
    .where((s) => s.isTruncated())
    .map((entry) => ({
      left: entry,
      right: entry.withOperation("bevel"),
      options: { left: {}, right: { facet: entry.facet() } },
    })),
})

const _expand = makeOpPair<ClassicalForme, {}, FacetOpts>({
  ...resizeArgs,
  graph: Classical.query
    .where((s) => s.isRegular())
    .map((entry) => {
      return {
        left: entry,
        right: entry.withOperation("cantellate"),
        options: { left: {}, right: { facet: entry.facet() } },
      }
    }),
})

const _snub = makeOpPair<ClassicalForme, TwistOpts, FacetOpts>({
  ...resizeArgs,
  graph: Classical.query
    .where((s) => s.isRegular())
    .flatMap((entry) => {
      return twists.map((twist) => ({
        left: entry,
        right: entry.withOperation(
          "snub",
          // If a vertex-solid, the chirality of the result
          // is *opposite* of the twist option
          entry.isVertex() ? oppositeTwist(twist) : twist,
        ),
        options: { left: { twist }, right: { facet: entry.facet() } },
      }))
    }),
})

const _twist = makeOpPair<ClassicalForme, TwistOpts, {}>({
  ...getResizeArgs(() => "face"),
  graph: Classical.query
    .where((s) => s.isCantellated())
    .flatMap((entry) => {
      return twists.map((twist) => ({
        left: entry,
        right: entry.withOperation("snub", twist),
        options: { left: { twist }, right: {} },
      }))
    }),
})

function getCantellatedMidradius(forme: ClassicalForme) {
  return forme.edgeFace().distanceToCenter()
}

/**
 * Take the cantellated intermediate solid and convert it to either dual
 */
function doDualTransform(forme: ClassicalForme, result: Classical) {
  const resultForme = ClassicalForme.fromSpecs(result)
  const resultSideLength =
    getCantellatedMidradius(forme) / resultForme.midradius()
  const scale = resultSideLength * resultForme.circumradius()
  const faces = forme.facetFaces(oppositeFacet(result.facet()))
  return getTransformedVertices(faces, (f) => {
    return forme.geom.centroid().add(f.normal().scale(scale))
  })
}

const _dual = makeOpPair<ClassicalForme>({
  graph: Classical.query
    .where((s) => s.isRegular() && !s.isVertex())
    .map((specs) => ({
      left: specs,
      right: specs.withData({ facet: "vertex" }),
    })),
  middle: (entry) => entry.left.withOperation("cantellate"),
  getPose(pos, forme) {
    const { geom } = forme
    switch (pos) {
      case "left": {
        return {
          ...getClassicalPose(forme, "face"),
          // Everything is scaled with the same midradius
          scale: forme.midradius(),
        }
      }
      case "right": {
        // for the vertex figure, pick a vertex and align it with that edge
        const vertex = geom.getVertex()
        const normal = vertex.vec.sub(geom.centroid())
        const v2 = vertex.adjacentVertices()[0]
        return {
          origin: geom.centroid(),
          scale: forme.midradius(),
          orientation: [normal, v2.vec.sub(vertex.vec)],
        }
      }
      case "middle": {
        return {
          ...getClassicalPose(forme, "face"),
          scale: getCantellatedMidradius(forme),
        }
      }
    }
  },
  toLeft: (forme, _, result) => doDualTransform(forme, result),
  toRight: (forme, _, result) => doDualTransform(forme, result),
})

// Exported members

export const dual = new Operation("dual", combineOps([_dual.left, _dual.right]))

export const expand = new Operation(
  "expand",
  combineOps([semiExpand.left, _expand.left]),
)

export const snub = makeOperation("snub", _snub.left)

export const twist = makeOperation(
  "twist",
  combineOps([_twist.left, _twist.right]),
)

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = makeOperation<FacetOpts, ClassicalForme>("contract", {
  ...combineOps([_expand, _snub, semiExpand].map((op) => op.right)),

  hitOption: "facet",
  getHitOption(forme, hitPoint) {
    const hitFace = forme.geom.hitFace(hitPoint)
    const facet = forme.getFacet(hitFace)
    return facet ? { facet } : {}
  },

  faceSelectionStates(forme, { facet }) {
    return forme.geom.faces.map((face) => {
      if (forme.isFacetFace(face, facet)) return "selected"
      if (forme.isAnyFacetFace(face)) return "selectable"
      return undefined
    })
  },
})
