import _ from 'lodash'
import { geom } from 'toxiclibsjs'
const { Vec3D, Triangle3D, Plane } = geom

export const PRECISION_DIGITS = 3
export const PRECISION = Math.pow(10, -PRECISION_DIGITS)

// convert an array of vertices into a vector
export const vec = p => new Vec3D(...p)

export const getMidpoint = (v1, v2) => v1.add(v2).scale(0.5)
// Get the plane containing the given points
export function getPlane(points) {
  if (points.length < 3) {
    throw new Error('Need at least three points for a plane')
  }
  const triang = _.take(points, 3)
  return new Plane(new Triangle3D(...triang))
}

// Return whether the set of points lie on a plane
export function isPlanar(points) {
  const plane = getPlane(points)
  return _.every(points, vec => plane.getDistanceToPoint(vec) < PRECISION)
}

export function getCentroid(vectors) {
  return vectors.reduce((v1, v2) => v1.add(v2)).scale(1 / vectors.length)
}

// Get the normal of a polygon given its ordered vertices
export function getNormal(vertices) {
  const [v0, v1, v2] = vertices
  return v0.sub(v1).cross(v1.sub(v2))
}
