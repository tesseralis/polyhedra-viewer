import { sum } from "lodash-es"
import { Polyhedron, Face, Edge, VertexArg, Cap } from "math/polyhedra"
import Classical, { Operation as OpName } from "data/specs/Classical"
import Composite from "data/specs/Composite"
import { makeOpPair, combineOps, Pose } from "./operationPairs"
import Operation, { OpArgs } from "./Operation"
import { Vec3D, getCentroid, angleBetween } from "math/geom"
import {
  getGeometry,
  FacetOpts,
  getTransformedVertices,
} from "./operationUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"
import ClassicalForme from "math/formes/ClassicalForme"

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
      createForme: (specs, geom) => ClassicalForme.create(specs, geom),
    })
  }

  return {
    truncate: makePair("left", "middle"),
    cotruncate: makePair("middle", "right"),
    rectify: makePair("left", "right"),
  }
}

function getRegularPose(geom: Polyhedron, face: Face, crossPoint: Vec3D): Pose {
  return {
    origin: geom.centroid(),
    // scale on the inradius of the truncated face
    scale: face.distanceToCenter(),
    orientation: [face.normal(), crossPoint.sub(face.centroid())],
  }
}

/**
 * Describes the truncation operations on a Platonic solid.
 */
const regs = makeTruncateTrio({
  left: {
    operation: "regular",
    pose({ geom }) {
      const face = geom.getFace()
      return getRegularPose(geom, geom.getFace(), face.edges[0].midpoint())
    },
    transformer(forme) {
      return getTransformedVertices(forme.minorFacetFaces(), (face) =>
        getSharpenPointEdge(face, face.edges[0]),
      )
    },
  },
  middle: {
    operation: "truncate",
    pose({ geom }) {
      const face = geom.largestFace()
      const n = face.numSides
      // pick an edge connected to another truncated face
      const edge = face.edges.find((e) => e.twinFace().numSides === n)!
      return getRegularPose(geom, face, edge.midpoint())
    },
  },
  right: {
    operation: "rectify",
    // The rectified version is the only thing we need to choose an option for
    // when we move out of it
    options: (entry) => ({ facet: entry.data.facet }),
    pose(forme, options) {
      // pick a face that *isn't* the sharpen face type
      const face = forme.facetFace(options.right.facet)
      return getRegularPose(forme.geom, face, face.vertices[0].vec)
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

function getAmboPose(forme: ClassicalForme, face: Face, point: Vec3D): Pose {
  return {
    origin: forme.geom.centroid(),
    scale: getAvgInradius(forme),
    orientation: [face.normal(), point.sub(face.centroid())],
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
      const face = forme.geom.faceWithNumSides(forme.specs.data.family)
      return getAmboPose(forme, face, face.edges[0].midpoint())
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
      const face = forme.geom.faceWithNumSides(forme.specs.data.family * 2)
      const edge = face.edges.find((e) => e.twinFace().numSides !== 4)!
      return getAmboPose(forme, face, edge.midpoint())
    },
  },
  right: {
    operation: "cantellate",
    pose(forme) {
      const face = forme.facetFace("face")
      return getAmboPose(forme, face, face.vertices[0].vec)
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

const augTruncate = makeOpPair({
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
  getPose($, { geom, specs }) {
    const source = specs.data.source
    const isTetrahedron =
      source.isClassical() && source.isTetrahedral() && source.isRegular()

    // If source is a tetrahedron, take only the first cap (the other is the base)
    let caps = Cap.getAll(geom)
    if (isTetrahedron) {
      caps = [caps[0]]
    }
    const capVertIndices = caps.flatMap((cap) =>
      cap.innerVertices().map((v) => v.index),
    )
    const sourceVerts = geom.vertices.filter(
      (v) => !capVertIndices.includes(v.index),
    )
    // Calculate the centroid *only* for the source polyhedra
    const centroid = getCentroid(sourceVerts.map((v) => v.vec))
    function isSourceFace(face: Face) {
      return face.vertices.every((v) => !capVertIndices.includes(v.index))
    }
    function isBaseFace(face: Face) {
      return isTetrahedron || face.numSides > 3
    }
    const scaleFace = geom.faces.find((f) => isSourceFace(f) && isBaseFace(f))!
    const cap = caps[0]
    const mainAxis = cap.normal()
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
        .find((e) => isBaseFace(e.twinFace()))!
        .midpoint()
        .sub(boundary.centroid())
    }

    return {
      origin: centroid,
      scale: scaleFace.centroid().distanceTo(centroid),
      orientation: [mainAxis, crossAxis],
    }
  },
  toLeft({ geom }) {
    const capVertIndices = Cap.getAll(geom).flatMap((cap) =>
      cap.innerVertices().map((v) => v.index),
    )
    const sourceFaces = geom.faces.filter((f) =>
      f.vertices.every((v) => !capVertIndices.includes(v.index)),
    )
    const truncatedFaces = sourceFaces.filter((f) => f.numSides === 3)
    const cupolaFaces = geom.faces.filter((f) =>
      f.vertices.every((v) => capVertIndices.includes(v.index)),
    )
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
          const edge = face.edges.find((e) => e.twinFace().numSides > 5)!
          return getSharpenPointEdge(face, edge)
        }
      },
    )
  },
  createForme: (specs, geom) => new PolyhedronForme(specs, geom),
})

// Exported operations

export const truncate = new Operation(
  "truncate",
  combineOps<Classical | Composite, any>([
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

const hitOptArgs: Partial<OpArgs<FacetOpts, Classical>> = {
  hitOption: "facet",
  getHitOption({ geom }, hitPoint) {
    const n = geom.hitFace(hitPoint).numSides
    return n <= 5 ? { facet: n === 3 ? "face" : "vertex" } : {}
  },

  faceSelectionStates({ specs, geom }, { facet }) {
    const faceType = !facet ? null : facet === "face" ? 3 : specs.data.family
    return geom.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
}

export const sharpen = new Operation("sharpen", {
  ...combineOps<Classical | Composite, FacetOpts>([
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
  ...combineOps<Classical, FacetOpts>([
    regs.cotruncate.right,
    ambos.cotruncate.right,
  ]),
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ...combineOps<Classical, FacetOpts>([
    regs.rectify.right,
    ambos.rectify.right,
  ]),
  ...hitOptArgs,
})
