import { Vector3, Ray, Matrix4 } from "three"
import { translateMat } from "math/geom"
import type Polyhedron from "./Polyhedron"

export default abstract class Facet {
  polyhedron: Polyhedron

  constructor(polyhedron: Polyhedron) {
    this.polyhedron = polyhedron
  }

  abstract centroid(): Vector3

  abstract normal(): Vector3

  normalRay() {
    return new Ray(this.centroid(), this.normal())
  }

  /** Get the rotation matrix for rotation around this face's normal */
  rotateNormal(angle: number) {
    return new Matrix4().makeRotationAxis(this.normal(), angle)
  }

  /** Get the matrix for translating a point the given amount in the direction of this normal */
  translateNormal(amount: number) {
    const scaled = this.normal().clone().setLength(amount)
    return translateMat(scaled)
  }

  distanceToCenter() {
    const origin = this.polyhedron.centroid()
    return origin.distanceTo(this.centroid())
  }
}
