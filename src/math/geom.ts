import { Vector3, Plane, Ray, Matrix4 } from "three"
import { Point } from "types"

// Re-export useful things so its easier to switch
export { Vector3, Ray, Plane }

export const PRECISION_DIGITS = 3
export const PRECISION = 10 ** -PRECISION_DIGITS

// convert an array of vertices into a vector
export const vec = (p: Point) => new Vector3(...p)

export function vecEquals(v1: Vector3, v2: Vector3) {
  return v1.distanceTo(v2) < PRECISION
}

export const getMidpoint = (v1: Vector3, v2: Vector3) =>
  new Vector3().addVectors(v1, v2).divideScalar(2)

export function isInverse(v1: Vector3, v2: Vector3) {
  return vecEquals(v1.clone().negate(), v2)
}

export function angleBetween(o: Vector3, a: Vector3, b: Vector3) {
  // colinear points return NaN, so return 0 instead
  // FIXME? make sure we don't need to normalize this?
  return a.clone().sub(o).angleTo(b.clone().sub(o))
}

// Get the plane containing the given points
export function getPlane(points: Vector3[]) {
  if (points.length < 3) {
    throw new Error("Need at least three points for a plane")
  }
  return new Plane().setFromCoplanarPoints(points[0], points[1], points[2])
}

// Return whether the set of points lie on a plane
export function isPlanar(points: Vector3[]) {
  const plane = getPlane(points)
  return points.every((vec) => Math.abs(plane.distanceToPoint(vec)) < PRECISION)
}

export function getCentroid(vectors: Vector3[]) {
  return vectors
    .reduce((v1, v2) => v1.add(v2), new Vector3())
    .divideScalar(vectors.length)
}

// Get the normal of a polygon given its ordered vertices
export function getNormal(vertices: Vector3[]) {
  const [v0, v1, v2] = vertices
  return v0.clone().sub(v1).cross(v1.clone().sub(v2)).normalize()
}

export function getNormalRay(vertices: Vector3[]) {
  return new Ray(getCentroid(vertices), getNormal(vertices))
}

export type Transform = (v: Vector3) => Vector3

export function withOrigin(o: Vector3, t: Transform): Transform {
  return (v) => t(v.clone().sub(o)).add(o)
}

/**
 * Return the rotation matrix based on the orthonormal bases v1, v2, and (v1 x v2)
 */
export function getOrientation(v1: Vector3, v2: Vector3) {
  return new Matrix4().makeBasis(v1, v2, new Vector3().crossVectors(v1, v2))
}

/**
 * Return the rotation matrix that transforms the basis (u1, u2, u1 x u2) to (v1, v2, v1 x v2)
 */
export function getOrthonormalTransform(
  u1: Vector3,
  u2: Vector3,
  v1: Vector3,
  v2: Vector3,
) {
  // https://math.stackexchange.com/questions/624348/finding-rotation-axis-and-angle-to-align-two-oriented-vectors
  const uOrientation = getOrientation(u1, u2)
  const vOrientation = getOrientation(v1, v2)
  return vOrientation.multiply(uOrientation.transpose())
}
