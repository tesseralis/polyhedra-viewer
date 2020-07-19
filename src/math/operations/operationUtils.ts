import { takeRight, dropRight, invert, isEmpty, uniq } from "lodash-es"
import { Twist } from "types"
import { Polyhedron, Vertex, VertexList, VertexArg } from "math/polyhedra"
import { Vec3D, Transform, PRECISION } from "math/geom"
import { mapObject } from "utils"
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

export function getTwistSign(twist?: Twist) {
  switch (twist) {
    case "left":
      return 1
    case "right":
      return -1
    default:
      return 0
  }
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
  vLists: T[],
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
