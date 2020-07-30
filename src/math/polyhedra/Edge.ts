import { angleBetween, getMidpoint, vecEquals } from "math/geom"
import type Polyhedron from "./Polyhedron"
import type Vertex from "./Vertex"
import type { VertexList } from "./Vertex"

export default class Edge implements VertexList {
  polyhedron: Polyhedron
  v1: Vertex
  v2: Vertex

  constructor(v1: Vertex, v2: Vertex) {
    this.polyhedron = v1.polyhedron
    this.v1 = v1
    this.v2 = v2
  }

  get value(): [number, number] {
    return [this.v1.index, this.v2.index]
  }

  get vertices() {
    return [this.v1, this.v2]
  }

  get face() {
    return this.polyhedron.edgeToFaceGraph()[this.v1.index][this.v2.index]
  }

  prev() {
    return this.face.edges.find((e) => e.v2.equals(this.v1))!
  }

  next() {
    return this.face.edges.find((e) => e.v1.equals(this.v2))!
  }

  length() {
    return this.v1.vec.distanceTo(this.v2.vec)
  }

  isValid() {
    return !vecEquals(this.v1.vec, this.v2.vec)
  }

  midpoint() {
    return getMidpoint(this.v1.vec, this.v2.vec)
  }

  twin() {
    return new Edge(this.v2, this.v1)
  }

  twinFace() {
    return this.twin().face
  }

  // Get the "undirected" version of this edge, represented by
  // the version where its vertices are ordered by their index
  undirected() {
    return this.v2.index > this.v1.index ? this : this.twin()
  }

  // Get the faces adjacent to this edge, with the directed face first
  adjacentFaces() {
    return [this.face, this.twin().face]
  }

  // Distance of this midpoint to polyhedron center
  distanceToCenter() {
    return this.midpoint().distanceTo(this.polyhedron.centroid())
  }

  dihedralAngle() {
    return angleBetween(
      this.midpoint(),
      this.face.centroid(),
      this.twinFace().centroid(),
    )
  }

  equals(edge: Edge) {
    return this.v1.equals(edge.v1) && this.v2.equals(edge.v2)
  }
}
