import { sum } from "lodash-es"
import { Face, Edge, VertexArg } from "math/polyhedra"
import Classical, { Facet, Operation as OpName } from "data/specs/Classical"
import Composite from "data/specs/Composite"
import { makeOpPair, combineOps } from "./operationPairs"
import Operation, { OpArgs } from "./Operation"
import { Vec3D, getCentroid, angleBetween } from "math/geom"
import {
  getGeometry,
  FacetOpts,
  getTransformedVertices,
  Pose,
} from "./operationUtils"
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

function getAvgInradius(forme: ClassicalForme) {
  const faces = [forme.facetFace("vertex"), forme.facetFace("face")]
  return sum(faces.map((f) => f.distanceToCenter())) / faces.length
}

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  pose(solid: ClassicalForme, opts: Opts): Pose
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
      getPose: ($, solid, options) => {
        // Use the pose function for the side that matches the op name of the solid
        const side = Object.values(args).find(
          (arg) => arg.operation === solid.specs.data.operation,
        )
        return side.pose(solid, options)
      },
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

function getRegularPose(forme: ClassicalForme, facet: Facet): Pose {
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
const regs = makeTruncateTrio({
  left: {
    operation: "regular",
    pose(forme) {
      return getRegularPose(forme, forme.specs.data.facet!)
    },
    transformer(forme) {
      return getTransformedVertices(forme.minorFacetFaces(), (face) =>
        getSharpenPointEdge(face, face.edges[0]),
      )
    },
  },
  middle: {
    operation: "truncate",
    pose(forme) {
      return getRegularPose(forme, forme.specs.data.facet!)
    },
  },
  right: {
    operation: "rectify",
    // The rectified version is the only thing we need to choose an option for
    // when we move out of it
    options: (entry) => ({ facet: entry.data.facet }),
    pose(forme, options) {
      return getRegularPose(forme, options.right.facet)
    },
    transformer({ geom }) {
      // All edges that between two truncated faces
      const edges = geom.edges.filter(
        (e) => e.face.numSides > 5 && e.twinFace().numSides > 5,
      )
      // Move each edge to its midpoint
      return getTransformedVertices(edges, (e) => e.midpoint())
    },
  },
})

function getAmboPose(forme: ClassicalForme): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: getAvgInradius(forme),
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
const ambos = makeTruncateTrio({
  left: {
    operation: "rectify",
    pose(forme) {
      return getAmboPose(forme)
    },
    transformer(forme, $, resultSpec) {
      const ref = getGeometry(resultSpec)
      const refForme = ClassicalForme.create(resultSpec, ref)
      const refInradius = getAvgInradius(refForme)
      const refCircumradius = ref.getVertex().distanceToCenter()
      const inradius = getAvgInradius(forme)
      const scale = (refCircumradius / refInradius) * inradius
      const faces = forme.geom.faces.filter((f) => f.numSides === 4)
      // Sharpen each of the faces to a point aligning with the vertices
      // of the rectified solid
      return getTransformedVertices(faces, (f) =>
        forme.geom.centroid().add(f.normal().scale(scale)),
      )
    },
  },
  middle: {
    operation: "bevel",
    pose(forme) {
      return getAmboPose(forme)
    },
  },
  right: {
    operation: "cantellate",
    pose(forme) {
      return getAmboPose(forme)
    },
    transformer(forme, $, resultSpec) {
      const ref = getGeometry(resultSpec)
      const refForme = ClassicalForme.create(resultSpec, ref)
      const refInradius = getAvgInradius(refForme)
      const refFace = refForme.edgeFace()
      const refMidradius = refFace.distanceToCenter()
      const refFaceRadius = refFace.radius()
      const inradius = getAvgInradius(forme)
      const scale = inradius / refInradius
      const faces = forme.geom.faces.filter((f) => f.numSides === 4)
      return getTransformedVertices(faces, (f) => {
        const faceCentroid = forme.geom
          .centroid()
          .add(f.normal().scale(refMidradius * scale))

        return (v) =>
          faceCentroid.add(
            v
              .sub(f.centroid())
              .getNormalized()
              .scale(refFaceRadius * scale),
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
    return facet ? { facet: facet === "vertex" ? "face" : "vertex" } : {}
  },

  faceSelectionStates(forme, { facet }) {
    const oppFacet = facet === "vertex" ? "face" : "vertex"
    return forme.geom.faces.map((face) => {
      if (forme.isFacetFace(face, oppFacet)) return "selected"
      return "selectable"
    })
  },
}

export const sharpen = new Operation("sharpen", {
  ...combineOps<
    Classical | Composite,
    ClassicalForme | CompositeForme,
    FacetOpts
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
