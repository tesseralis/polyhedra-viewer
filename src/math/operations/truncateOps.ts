import { sum } from "lodash-es"
import { Polyhedron, Face, VertexArg, Cap } from "math/polyhedra"
import Classical, { Operation as OpName } from "data/specs/Classical"
import Composite from "data/specs/Composite"
import { makeOpPair, combineOps, Pose } from "./operationPairs"
import Operation, { SolidArgs, OpArgs } from "./Operation"
import { Plane } from "toxiclibsjs/geom"
import { Vec3D, getCentroid } from "math/geom"
import {
  getGeometry,
  FacetOpts,
  getTransformedVertices,
} from "./operationUtils"
// TODO move this to a util
import { getCantellatedFace, getCantellatedEdgeFace } from "./resizeOps"

function getSharpenFaces(polyhedron: Polyhedron) {
  const faceType = polyhedron.smallestFace().numSides
  return polyhedron.faces.filter((f) => f.numSides === faceType)
}

function getSharpenDist(face: Face) {
  const theta = Math.PI - face.edges[0].dihedralAngle()
  return face.apothem() * Math.tan(theta)
}

function getVertexToAdd(face: Face) {
  const dist = getSharpenDist(face)
  return face.normalRay().getPointAtDistance(dist)
}

function getAvgInradius(specs: Classical, geom: Polyhedron) {
  let faces: Face[]
  if (specs.isRectified()) {
    faces = [geom.faceWithNumSides(3), geom.faceWithNumSides(specs.data.family)]
  } else if (specs.isBevelled()) {
    faces = [
      geom.faceWithNumSides(6),
      geom.faceWithNumSides(2 * specs.data.family),
    ]
  } else if (specs.isCantellated()) {
    faces = [
      geom.faceWithNumSides(3),
      getCantellatedFace(geom, specs.data.family),
    ]
  } else {
    throw new Error(`Invalid specs: ${specs.name()}`)
  }
  return sum(faces.map((f) => f.distanceToCenter())) / faces.length
}

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  pose(solid: SolidArgs<Classical>, opts: Opts): Pose
  transformer(
    solid: SolidArgs<Classical>,
    opts: Opts,
    result: Classical,
  ): VertexArg[]
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
    transformer({ geom }) {
      return getTransformedVertices(getSharpenFaces(geom), (face) =>
        getVertexToAdd(face),
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
    pose({ specs, geom }, options) {
      // pick a face that *isn't* the sharpen face type
      const faceType = options.right.facet === "vertex" ? 3 : specs.data.family
      const face = geom.faceWithNumSides(faceType)
      return getRegularPose(geom, face, face.vertices[0].vec)
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

function getAmboPose(
  specs: Classical,
  geom: Polyhedron,
  face: Face,
  point: Vec3D,
): Pose {
  return {
    origin: geom.centroid(),
    scale: getAvgInradius(specs, geom),
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
    pose({ geom, specs }) {
      const face = geom.faceWithNumSides(specs.data.family)
      return getAmboPose(specs, geom, face, face.edges[0].midpoint())
    },
    transformer({ geom, specs }, $, resultSpec) {
      const ref = getGeometry(resultSpec)
      const refInradius = getAvgInradius(resultSpec, ref)
      const refCircumradius = ref.getVertex().distanceToCenter()
      const inradius = getAvgInradius(specs, geom)
      const scale = (refCircumradius / refInradius) * inradius
      const faces = geom.faces.filter((f) => f.numSides === 4)
      // Sharpen each of the faces to a point aligning with the vertices
      // of the rectified solid
      return getTransformedVertices(faces, (f) =>
        geom.centroid().add(f.normal().scale(scale)),
      )
    },
  },
  middle: {
    operation: "bevel",
    pose({ geom, specs }) {
      const face = geom.faceWithNumSides(specs.data.family * 2)
      const edge = face.edges.find((e) => e.twinFace().numSides !== 4)!
      return getAmboPose(specs, geom, face, edge.midpoint())
    },
  },
  right: {
    operation: "cantellate",
    pose({ geom, specs }) {
      const face = getCantellatedFace(geom, specs.data.family)
      return getAmboPose(specs, geom, face, face.vertices[0].vec)
    },
    transformer({ geom, specs }, $, resultSpec) {
      const ref = getGeometry(resultSpec)
      const refInradius = getAvgInradius(resultSpec, ref)
      const refFace = getCantellatedEdgeFace(ref)
      const refMidradius = refFace.distanceToCenter()
      const refFaceRadius = refFace.radius()
      const inradius = getAvgInradius(specs, geom)
      const scale = inradius / refInradius
      const faces = geom.faces.filter((f) => f.numSides === 4)
      return getTransformedVertices(faces, (f) => {
        const faceCentroid = geom
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

function getDirection(v1: Vec3D, v2: Vec3D) {
  return v2.sub(v1).getNormalized()
}

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
    let caps = Cap.getAll(geom)
    const isTetrahedron =
      source.isClassical() && source.isTetrahedral() && source.isRegular()
    // If source is a tetrahedron, take only the first cap (the other is the base)
    if (isTetrahedron) {
      caps = [caps[0]]
    }
    const capVertIndices = caps.flatMap((cap) =>
      cap.innerVertices().map((v) => v.index),
    )
    const sourceVerts = geom.vertices.filter(
      (v) => !capVertIndices.includes(v.index),
    )
    const centroid = getCentroid(sourceVerts.map((v) => v.vec))
    const sourceFaces = geom.faces.filter((f) =>
      f.vertices.every((v) => !capVertIndices.includes(v.index)),
    )
    const scaleFace = sourceFaces.find(
      (face) => isTetrahedron || face.numSides > 3,
    )!
    const cap = caps[0]
    const mainAxis = cap.normal()

    const boundary = cap.boundary()
    let crossAxis
    if (specs.isTri()) {
      const cap1 = caps[1]
      const cap2 = caps[2]
      const midpoint = getCentroid([cap1.normal(), cap2.normal()])
      crossAxis = new Plane(Vec3D.ZERO, boundary.normal()).getProjectedPoint(
        midpoint,
      )
    } else if (specs.isBi() && specs.isMeta()) {
      const cap1 = caps[1]
      // FIXME Maybe we should just have a getPlane for FaceLike
      crossAxis = new Plane(Vec3D.ZERO, boundary.normal()).getProjectedPoint(
        cap1.normal(),
      )
    } else {
      crossAxis = boundary.edges
        .find((e) => isTetrahedron || e.twinFace().numSides > 3)!
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
    const caps = Cap.getAll(geom)
    const capVertIndices = caps.flatMap((cap) =>
      cap.innerVertices().map((v) => v.index),
    )
    const sourceFaces = geom.faces.filter((f) =>
      f.vertices.every((v) => !capVertIndices.includes(v.index)),
    )
    const truncatedFaces = sourceFaces.filter((f) => f.numSides === 3)
    const innerCapFaces = geom.faces.filter((f) =>
      f.vertices.every((v) => capVertIndices.includes(v.index)),
    )
    const innerFaceIndices = innerCapFaces.map((f) => f.index)
    return getTransformedVertices(
      [...truncatedFaces, ...innerCapFaces],
      (face) => {
        if (innerFaceIndices.includes(face.index)) {
          const v = face.vertices[0]
          const otherFace = v
            .adjacentFaces()
            .find((f) => f.numSides === 3 && !f.equals(face))!
          const theta = getDirection(v.vec, face.centroid()).angleBetween(
            getDirection(v.vec, otherFace.centroid()),
          )
          const theta2 = Math.PI - theta
          const sharpenDist = face.radius() * Math.tan(theta2)
          return face.normalRay().getPointAtDistance(sharpenDist)
        } else {
          // Sharpen the source faces
          // FIXME this is duplicated from getSharpenDist
          const edge = face.edges.find((e) => e.twinFace().numSides > 5)!
          const theta = Math.PI - edge.dihedralAngle()
          const sharpenDist = face.apothem() * Math.tan(theta)
          return face.normalRay().getPointAtDistance(sharpenDist)
        }
      },
    )
  },
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
