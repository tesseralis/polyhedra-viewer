import { Vector3 as Vec3D, Plane, Ray as Ray3D, Matrix4 } from "three"
import { Point } from "types"

// Re-export useful things so its easier to switch
export { Vec3D, Ray3D, Plane }

export const PRECISION_DIGITS = 3
export const PRECISION = 10 ** -PRECISION_DIGITS

// convert an array of vertices into a vector
export const vec = (p: Point) => new Vec3D(...p)

export function vecEquals(v1: Vec3D, v2: Vec3D) {
  return v1.distanceTo(v2) < PRECISION
}

export const getMidpoint = (v1: Vec3D, v2: Vec3D) =>
  v1.clone().add(v2).multiplyScalar(0.5)

export function isInverse(v1: Vec3D, v2: Vec3D) {
  return vecEquals(v1.clone().negate(), v2)
}

export function angleBetween(o: Vec3D, a: Vec3D, b: Vec3D) {
  // colinear points return NaN, so return 0 instead
  // FIXME? make sure we don't need to normalize this?
  return a.clone().sub(o).angleTo(b.clone().sub(o))
}

// Get the plane containing the given points
export function getPlane(points: Vec3D[]) {
  if (points.length < 3) {
    throw new Error("Need at least three points for a plane")
  }
  return new Plane().setFromCoplanarPoints(points[0], points[1], points[2])
}

// Return whether the set of points lie on a plane
export function isPlanar(points: Vec3D[]) {
  const plane = getPlane(points)
  return points.every((vec) => Math.abs(plane.distanceToPoint(vec)) < PRECISION)
}

export function getCentroid(vectors: Vec3D[]) {
  return vectors
    .reduce((v1, v2) => v1.add(v2), new Vec3D())
    .multiplyScalar(1 / vectors.length)
}

// Get the normal of a polygon given its ordered vertices
export function getNormal(vertices: Vec3D[]) {
  const [v0, v1, v2] = vertices
  return v0.clone().sub(v1).cross(v1.clone().sub(v2)).normalize()
}

export function getNormalRay(vertices: Vec3D[]) {
  return new Ray3D(getCentroid(vertices), getNormal(vertices))
}

export type Transform = (v: Vec3D) => Vec3D

export function withOrigin(o: Vec3D, t: Transform): Transform {
  return (v) => t(v.clone().sub(o)).clone().add(o)
}

/**
 * Return the rotation matrix based on the orthonormal bases v1, v2, and (v1 x v2)
 */
export function getOrientation(v1: Vec3D, v2: Vec3D) {
  return new Matrix4().makeBasis(v1, v2, v1.clone().cross(v2))
}

/**
 * Return the rotation matrix that transforms the basis (u1, u2, u1 x u2) to (v1, v2, v1 x v2)
 */
export function getOrthonormalTransform(
  u1: Vec3D,
  u2: Vec3D,
  v1: Vec3D,
  v2: Vec3D,
) {
  // https://math.stackexchange.com/questions/624348/finding-rotation-axis-and-angle-to-align-two-oriented-vectors
  const uOrientation = getOrientation(u1, u2)
  const vOrientation = getOrientation(v1, v2)
  return vOrientation.multiply(uOrientation.transpose())
}
