import { takeRight, dropRight, invert, isEmpty, uniq } from "lodash-es"
import { Polyhedron, Edge, Vertex, VertexList, VertexArg } from "math/polyhedra"
import {
  Plane,
  Vec3D,
  Transform,
  vecEquals,
  getOrthonormalTransform,
  withOrigin,
} from "math/geom"
import { mapObject } from "utils"
import { PolyhedronSpecs, Facet, Twist } from "specs"

export interface FacetOpts {
  facet: Facet
}

export interface TwistOpts {
  twist: Twist
}

/**
 * Get the face opposite of the given edge, using the given "twist" option
 */
export function oppositeFace(edge: Edge, twist?: Twist) {
  switch (twist) {
    case "left":
      return edge.twin().next().twin().prev().twinFace()
    case "right":
      return edge.twin().prev().twin().next().twinFace()
    default:
      // If no twist is provided, assume a square
      return edge.twin().next().next().twinFace()
  }
}

/**
 * Defines an orthonormal orientation.
 * An orientation [u, v] defineds the basis [u, v, u x v]
 */
type Orientation = readonly [Vec3D, Vec3D]

/**
 * Defines a scale, origin, and orientation used to transform one polyhedron to another.
 */
export interface Pose {
  scale: number
  origin: Vec3D
  orientation: Orientation
}

function normalizeOrientation([u1, u2]: Orientation): Orientation {
  const _u1 = u1.clone().normalize()
  const _u2 = new Plane(_u1).projectPoint(u2, new Vec3D()).normalize()
  return [_u1, _u2]
}

// Translate, rotate, and scale the polyhedron with the transformation given by the two poses
export function alignPolyhedron(solid: Polyhedron, pose1: Pose, pose2: Pose) {
  const [u1, u2] = normalizeOrientation(pose1.orientation)
  const [v1, v2] = normalizeOrientation(pose2.orientation)
  const matrix = getOrthonormalTransform(u1, u2, v1, v2)
  const rotate = withOrigin(pose2.origin, (u) => u.clone().applyMatrix4(matrix))
  const newVertices = solid.vertices.map((v) =>
    rotate(
      v.vec
        .clone()
        .sub(pose1.origin)
        .multiplyScalar(pose2.scale / pose1.scale)
        .add(pose2.origin),
    ),
  )
  return solid.withVertices(newVertices)
}

/**
 * Return the Polyhedron geometry matching the given specs
 */
export function getGeometry(specs: PolyhedronSpecs) {
  const geom = Polyhedron.get(specs.canonicalName())
  // The reference models are always right-handed,
  // so flip 'em if not
  // TODO don't rely on this and make it more general
  if (specs.isClassical() && specs.isSnub() && specs.data.twist === "left") {
    return geom.reflect()
  }

  if (specs.isCapstone() && specs.isChiral()) {
    if (specs.isCupolaRotunda() && specs.data.twist === "left") {
      return geom.reflect()
    } else if (!specs.isCupolaRotunda() && specs.data.twist === "right") {
      return geom.reflect()
    }
  }
  return geom
}

/**
 * Remove vertices in the polyhedron that aren't connected to any faces,
 * and remap the faces to the smaller indices
 */
export function removeExtraneousVertices(polyhedron: Polyhedron) {
  // Vertex indices to remove
  const vertsInFaces = polyhedron.faces.flatMap((f) => f.vertices)
  const toRemove = polyhedron.vertices.filter((v) => !v.inSet(vertsInFaces))
  const numToRemove = toRemove.length

  // Map the `numToRemove` last vertices of the polyhedron (that don't overlap)
  // to the first few removed vertices
  const notToRemove = takeRight(polyhedron.vertices, numToRemove).filter(
    (v) => !v.inSet(toRemove),
  )
  const newToOld = mapObject(notToRemove, (v, i) => [
    v.index,
    toRemove[i].index,
  ])
  const oldToNew = invert(newToOld)

  const newVertices = dropRight(
    polyhedron.vertices.map(
      (v) => polyhedron.vertices[(oldToNew[v.index] as any) ?? v.index],
    ),
    numToRemove,
  )

  return polyhedron.withChanges((solid) =>
    solid
      .withVertices(newVertices)
      .mapFaces((face) =>
        face.vertices.map((v) => newToOld[v.index] ?? v.index),
      ),
  )
}

/** Remove vertices (and faces) from the polyhedron when they are all the same */
export function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const unique: Vertex[] = []
  const oldToNew: Record<number, number> = {}

  polyhedron.vertices.forEach((v, vIndex) => {
    const match = unique.find((point) => vecEquals(v.vec, point.vec))
    if (match === undefined) {
      unique.push(v)
      oldToNew[vIndex] = vIndex
    } else {
      oldToNew[vIndex] = match.index
    }
  })

  if (isEmpty(oldToNew)) return polyhedron

  // replace vertices that are the same
  const newFaces = polyhedron.faces
    .map((face) => uniq(face.vertices.map((v) => oldToNew[v.index])))
    .filter((vIndices) => vIndices.length >= 3)

  // remove extraneous vertices
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

/**
 * Apply a transformation per vertex list. This function allows transformations like
 * "blow up these faces away from a center point" or "expand these faces out radially".
 *
 * @param vLists The list of `VertexList`s to apply transformations to
 * @param iteratee the function to apply on each `VertexList` to generate a transform.
 * The function can either return a transform or a single vector value.
 * @param vertices The list of vertices to transform and return.
 * This defaults to the vertices of the polyhedron attached to the first `VertexList`.
 */
export function getTransformedVertices<T extends VertexList>(
  vLists: readonly T[],
  iteratee: (key: T) => Transform | Vec3D,
  vertices: Vertex[] = vLists[0].polyhedron.vertices,
) {
  const result: VertexArg[] = [...vertices]
  for (const vList of vLists) {
    for (const v of vList.vertices) {
      const t = iteratee(vList)
      result[v.index] = typeof t === "function" ? t(v.vec) : t
    }
  }
  return result
}
