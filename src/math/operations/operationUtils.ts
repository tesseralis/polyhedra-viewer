import { takeRight, dropRight, invert, isEmpty, uniq } from "lodash-es"
import {
  Cap,
  Polyhedron,
  Edge,
  Vertex,
  VertexList,
  VertexArg,
} from "math/polyhedra"
import { Vec3D, Transform, PRECISION } from "math/geom"
import { mapObject } from "utils"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Facet } from "data/specs/Classical"
import { Twist } from "types"
import { getAllSpecs } from "data/specs/getSpecs"

export interface FacetOpts {
  facet?: Facet
}

export interface TwistOpts {
  twist?: Twist
}

export function getOppTwist(twist: Twist) {
  return twist === "left" ? "right" : "left"
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
 * Get the chirality of the snub polyhedron
 */
export function snubChirality(geom: Polyhedron) {
  // Special case for icosahedron
  if (geom.largestFace().numSides === 3) {
    return "left"
  }
  const face = geom.faces.find((f) => f.numSides !== 3)!
  const other = oppositeFace(face.edges[0], "right")
  return other.numSides !== 3 ? "right" : "left"
}

/**
 * Get the chirality of the gyroelongated bicupola/rotunda
 */
export function capstoneChirality(geom: Polyhedron) {
  const [cap1, cap2] = Cap.getAll(geom)
  const boundary = cap1.boundary()
  const isCupolaRotunda = cap1.type !== cap2.type

  const nonTriangleFaceEdge = boundary.edges.find((e) => e.face.numSides !== 3)!
  const rightFaceAcross = oppositeFace(nonTriangleFaceEdge, "right")
  // I'm pretty sure this is the same logic as in augment
  if (isCupolaRotunda) {
    return rightFaceAcross.numSides !== 3 ? "right" : "left"
  }
  return rightFaceAcross.numSides !== 3 ? "left" : "right"
}

/**
 * Return all matching specs for the Polyhedron, with the right chiralities.
 */
export function* getValidSpecs(geom: Polyhedron): Generator<PolyhedronSpecs> {
  for (const specs of getAllSpecs(geom.name)) {
    if (!specs.isChiral()) {
      yield specs
    } else if (specs.isClassical()) {
      yield specs.withData({ twist: snubChirality(geom) })
    } else if (specs.isCapstone()) {
      yield specs.withData({ twist: capstoneChirality(geom) })
    }
  }
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
    const match = unique.find((point) =>
      v.vec.equalsWithTolerance(point.vec, PRECISION),
    )
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
