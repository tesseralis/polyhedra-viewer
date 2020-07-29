import { sum } from "lodash-es"
import { Face, Edge, VertexArg } from "math/polyhedra"
import Classical, {
  facets,
  Facet,
  oppositeFacet,
  Operation as OpName,
} from "data/specs/Classical"
import Composite from "data/specs/Composite"
import { makeOpPair, combineOps } from "./operationPairs"
import Operation, { OpArgs } from "./Operation"
import { Vec3D, getCentroid, angleBetween } from "math/geom"
import { FacetOpts, getTransformedVertices, Pose } from "./operationUtils"
import ClassicalForme from "math/formes/ClassicalForme"
import CompositeForme, {
  AugmentedClassicalForme,
} from "math/formes/CompositeForme"

/**
 * Returns the point to sharpen given parameters in the following setup:
 *      result
 *      / ^
 *     /  |
 *   p2___f.normal
 *   /
 * p1
 *
 */
function getSharpenPoint(face: Face, p1: Vec3D, p2: Vec3D) {
  const ray = face.normalRay()
  const theta1 = angleBetween(p1, p2, ray)
  const theta2 = Math.PI - theta1
  const dist = ray.distanceTo(p1) * Math.tan(theta2)
  return ray.getPointAtDistance(dist)
}

function getSharpenPointEdge(face: Face, edge: Edge) {
  return getSharpenPoint(face, edge.midpoint(), edge.twinFace().centroid())
}

function avgInradius(forme: ClassicalForme) {
  return sum(facets.map((f) => forme.inradius(f))) / facets.length
}

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  // pose(solid: ClassicalForme, opts: Opts): Pose
  transformer(solid: ClassicalForme, opts: Opts, result: Classical): VertexArg[]
  options?(entry: Classical): Opts
}

interface TrioArgs<L, M, R> {
  left: TrioOpArgs<L>
  middle: Omit<TrioOpArgs<M>, "transformer">
  right: TrioOpArgs<R>
}

/**
 * Create a trio of truncation OpPairs: truncate, cotruncate, and rectify.
 * Given the functions to use for operations, poses, and transformers,
 * generate the triplet of OpPairs to use.
 */
function makeTruncateTrio<L extends OpName, M extends OpName, R extends OpName>(
  getPose: (forme: ClassicalForme, options: any) => Pose,
  args: TrioArgs<L, M, R>,
) {
  const { left, right, middle } = args
  function makePair(leftOp: "left" | "middle", rightOp: "middle" | "right") {
    // Choose which side is the "middle" in order to short-circuit getting the intermediate
    const middleArg =
      leftOp === "middle" ? "left" : rightOp === "middle" ? "right" : null

    return makeOpPair({
      graph: Classical.query
        .where((s) => s.data.operation === middle.operation)
        .map((entry) => {
          return {
            left: entry.withData({ operation: args[leftOp].operation }),
            right: entry.withData({ operation: args[rightOp].operation }),
            options: {
              left: args[leftOp].options?.(entry),
              right: args[rightOp].options?.(entry),
            },
          }
        }),
      // If this is the left-right operation, then the intermediate
      // is going to be the middle operation
      middle:
        middleArg ??
        ((entry) => entry.left.withData({ operation: middle.operation })),
      getPose: ($, solid, options) => getPose(solid, options),
      toLeft: leftOp === "left" ? left.transformer : undefined,
      toRight: rightOp === "right" ? right.transformer : undefined,
    })
  }

  return {
    truncate: makePair("left", "middle"),
    cotruncate: makePair("middle", "right"),
    rectify: makePair("left", "right"),
  }
}

function getRegularPose(
  forme: ClassicalForme,
  facet: Facet = forme.specs.facet(),
): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: forme.facetFace(facet).distanceToCenter(),
    orientation: forme
      .adjacentFacetFaces(facet)
      .map((face) => face.normal()) as any,
  }
}

/**
 * Describes the truncation operations on a Platonic solid.
 */
const regs = makeTruncateTrio(
  (forme, options) => getRegularPose(forme, options?.right?.facet),
  {
    left: {
      operation: "regular",
      transformer(forme) {
        return getTransformedVertices(forme.minorFacetFaces(), (face) =>
          getSharpenPointEdge(face, face.edges[0]),
        )
      },
    },
    middle: { operation: "truncate" },
    right: {
      operation: "rectify",
      // The rectified version is the only thing we need to choose an option for
      // when we move out of it
      options: (entry) => ({ facet: entry.facet() }),
      transformer(forme) {
        // All edges that between two truncated faces
        const edges = forme.geom.edges.filter((e) =>
          e.adjacentFaces().every((f) => forme.isMainFacetFace(f)),
        )
        // Move each edge to its midpoint
        return getTransformedVertices(edges, (e) => e.midpoint())
      },
    },
  },
)

function getAmboPose(forme: ClassicalForme): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: avgInradius(forme),
    orientation: forme
      .adjacentFacetFaces("face")
      .map((face) => face.normal()) as any,
  }
}

/**
 * A trio of operations that describe the truncation behavior on a quasi-regular polyhedron
 * (tetratetrahedron, cuboctahedron, and icosidodecahedron).
 *
 * A raw truncation on one of these doesn't yield a CRF solid. We need to do some fudging
 * in order to everything to align correctly.
 *
 * We calculate the average inradius between the face-facet faces and the vertex-facet faces
 * and use that as a scale. For both, we use a reference polyhedron and calculate the vertex
 * transformations based on them.
 */
const ambos = makeTruncateTrio(getAmboPose, {
  left: {
    operation: "rectify",
    transformer(forme, $, result) {
      const refForme = ClassicalForme.fromSpecs(result)
      const refInradius = avgInradius(refForme)
      const inradius = avgInradius(forme)
      const scale = (refForme.circumradius() / refInradius) * inradius
      // Sharpen each of the faces to a point aligning with the vertices
      // of the rectified solid
      return getTransformedVertices(forme.edgeFaces(), (f) =>
        forme.geom.centroid().add(f.normal().scale(scale)),
      )
    },
  },
  middle: { operation: "bevel" },
  right: {
    operation: "cantellate",
    transformer(forme, $, result) {
      const refForme = ClassicalForme.fromSpecs(result)
      const edgeFace = refForme.edgeFace()
      const refMidradius = edgeFace.distanceToCenter()
      const scale = avgInradius(forme) / avgInradius(refForme)
      return getTransformedVertices(forme.edgeFaces(), (f) => {
        const faceCentroid = forme.geom
          .centroid()
          .add(f.normal().scale(refMidradius * scale))

        return (v) =>
          faceCentroid.add(
            v
              .sub(f.centroid())
              .getNormalized()
              .scale(edgeFace.radius() * scale),
          )
      })
    },
  },
})

const augTruncate = makeOpPair<Composite, AugmentedClassicalForme>({
  graph: Composite.query
    .where((s) => {
      const source = s.data.source
      return (
        s.isAugmented() &&
        !s.isDiminished() &&
        source.isClassical() &&
        source.isRegular()
      )
    })
    .map((entry) => ({
      left: entry,
      right: entry.withData({
        source: entry.data.source.withData({ operation: "truncate" }),
      }),
    })),
  middle: "right",
  getPose($, forme) {
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
      crossAxis = boundary.edges
        .find((e) => forme.isMainFace(e.twinFace()))!
        .midpoint()
        .sub(boundary.centroid())
    }

    return {
      origin: centroid,
      scale: forme.mainFace().centroid().distanceTo(centroid),
      orientation: [cap.normal(), crossAxis],
    }
  },
  toLeft(forme) {
    const truncatedFaces = forme.minorFaces()
    // the inner faces of the caps
    const cupolaFaces = forme.innerCapFaces()
    return getTransformedVertices(
      [...truncatedFaces, ...cupolaFaces],
      (face) => {
        if (cupolaFaces.some((f) => f.equals(face))) {
          // Sharpen the cupola faces
          const v = face.vertices[0]
          // Find a triangular cupola face
          const otherFace = v
            .adjacentFaces()
            .find((f) => f.numSides === 3 && !f.equals(face))!

          return getSharpenPoint(face, v.vec, otherFace.centroid())
        } else {
          const edge = face.edges.find((e) => forme.isMainFace(e.twinFace()))!
          return getSharpenPointEdge(face, edge)
        }
      },
    )
  },
})

// Exported operations

export const truncate = new Operation(
  "truncate",
  combineOps<Classical | Composite, ClassicalForme | CompositeForme, any>([
    regs.truncate.left,
    ambos.truncate.left,
    augTruncate.left,
  ]),
)

export const cotruncate = new Operation(
  "cotruncate",
  combineOps([regs.cotruncate.left, ambos.cotruncate.left]),
)

export const rectify = new Operation(
  "rectify",
  combineOps([regs.rectify.left, ambos.rectify.left]),
)

const hitOptArgs: Partial<OpArgs<FacetOpts, Classical, ClassicalForme>> = {
  hitOption: "facet",
  getHitOption(forme, hitPoint) {
    const face = forme.geom.hitFace(hitPoint)
    const facet = forme.getFacet(face)
    return facet ? { facet: oppositeFacet(facet) } : {}
  },

  faceSelectionStates(forme, { facet }) {
    return forme.geom.faces.map((face) => {
      if (forme.isFacetFace(face, oppositeFacet(facet))) return "selected"
      return "selectable"
    })
  },
}

export const sharpen = new Operation("sharpen", {
  ...combineOps<
    Classical | Composite,
    ClassicalForme | CompositeForme,
    Partial<FacetOpts>
  >([
    regs.truncate.right,
    ambos.truncate.right,
    augTruncate.right,
    regs.rectify.right,
    ambos.rectify.right,
  ]),
  // TODO split up sharpening rectified and sharpening truncated
  ...hitOptArgs,
})

// TODO the following operators are unused right now
// and need to be integrated into the app

export const cosharpen = new Operation("cosharpen", {
  ...combineOps<Classical, ClassicalForme, FacetOpts>([
    regs.cotruncate.right,
    ambos.cotruncate.right,
  ]),
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ...combineOps<Classical, ClassicalForme, FacetOpts>([
    regs.rectify.right,
    ambos.rectify.right,
  ]),
  ...hitOptArgs,
})
