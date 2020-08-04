import { angleBetween, getMidpoint, vecEquals } from "math/geom"
import Facet from "./Facet"
import type Vertex from "./Vertex"
import type { VertexList } from "./Vertex"
import { find } from "utils"

export default class Edge extends Facet implements VertexList {
  v1: Vertex
  v2: Vertex

  constructor(v1: Vertex, v2: Vertex) {
    super(v1.polyhedron)
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
    return find(this.face.edges, (e) => e.v2.equals(this.v1))
  }

  next() {
    return find(this.face.edges, (e) => e.v1.equals(this.v2))
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

  dihedralAngle() {
    return angleBetween(
      this.midpoint(),
      this.face.centroid(),
      this.twinFace().centroid(),
    )
  }

  normal() {
    return getMidpoint(this.face.normal(), this.twinFace().normal())
  }

  centroid() {
    return this.midpoint()
  }

  equals(edge: Edge) {
    return this.v1.equals(edge.v1) && this.v2.equals(edge.v2)
  }
}
