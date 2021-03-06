import { Vec3D } from "math/geom"

import {
  PRECISION,
  Plane,
  isPlanar,
  getCentroid,
  getNormal,
  getNormalRay,
} from "math/geom"
import type Polyhedron from "./Polyhedron"
import type Edge from "./Edge"
import type Vertex from "./Vertex"
import type { VertexList } from "./Vertex"

/**
 * An abstract polyhedral Face. An entity of a polyhedron that can be treated as a Face:
 * something containing vertices, edges and lying on a plane.
 * Examples include the boundary of a cupola and a concrete Face.
 */
export default class FaceLike implements VertexList {
  polyhedron: Polyhedron
  vertices: Vertex[]
  edges: Edge[]
  vectors: Vec3D[]

  constructor(vertices: Vertex[], edges: Edge[]) {
    this.polyhedron = vertices[0].polyhedron
    this.vertices = vertices
    this.edges = edges
    this.vectors = this.vertices.map((v) => v.vec)
  }

  get numSides() {
    return this.vertices.length
  }

  adjacentFaces() {
    return this.edges.map((edge) => edge.twin().face)
  }

  numUniqueSides() {
    return this.edges.filter((edge) => edge.length() > PRECISION).length
  }

  sideLength() {
    return this.edges[0].length()
  }

  isPlanar() {
    return isPlanar(this.vectors)
  }

  plane() {
    return new Plane(this.centroid(), this.normal())
  }

  apothem() {
    return this.sideLength() / (2 * Math.tan(Math.PI / this.numSides))
  }

  radius() {
    return this.sideLength() / (2 * Math.sin(Math.PI / this.numSides))
  }

  /** Get the area of a *regular* polygon */
  area() {
    return (this.numSides * this.sideLength() * this.apothem()) / 2
  }

  /** Return the centroid of the face given by the face index */
  centroid() {
    return getCentroid(this.vectors)
  }

  distanceToCenter() {
    const origin = this.polyhedron.centroid()
    return origin.distanceTo(this.centroid())
  }

  /** Return the normal of the face given by the face index */
  normal() {
    return getNormal(this.vectors)
  }

  normalRay() {
    return getNormalRay(this.vectors)
  }

  isValid() {
    return this.edges.every((edge) => edge.length() > PRECISION)
  }
}
