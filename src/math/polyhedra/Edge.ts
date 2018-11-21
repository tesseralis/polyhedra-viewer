import { getMidpoint } from 'math/geom';
import Polyhedron from './Polyhedron';
import Vertex, { VertexList } from './Vertex';
import Face from './Face';

export default class Edge implements VertexList {
  polyhedron: Polyhedron;
  v1: Vertex;
  v2: Vertex;

  constructor(v1: Vertex, v2: Vertex) {
    this.polyhedron = v1.polyhedron;
    this.v1 = v1;
    this.v2 = v2;
  }

  get value(): [number, number] {
    return [this.v1.index, this.v2.index];
  }

  get vertices() {
    return [this.v1, this.v2];
  }

  get face() {
    return this.polyhedron.edgeToFaceGraph()[this.v1.index][this.v2.index];
  }

  prev() {
    return this.face.prevEdge(this);
  }

  next() {
    return this.face.nextEdge(this);
  }

  length() {
    return this.v1.vec.distanceTo(this.v2.vec);
  }

  midpoint() {
    return getMidpoint(this.v1.vec, this.v2.vec);
  }

  twin() {
    return new Edge(this.v2, this.v1);
  }

  twinFace() {
    return this.twin().face;
  }

  // Get the "undirected" version of this edge, represented by
  // the version where its vertices are ordered by their index
  undirected() {
    return this.v2.index > this.v1.index ? this : this.twin();
  }

  // Get the faces adjacent to this edge, with the directed face first
  adjacentFaces() {
    return [this.face, this.twin().face];
  }

  // Distance of this midpoint to polyhedron center
  distanceToCenter() {
    return this.midpoint().distanceTo(this.polyhedron.centroid());
  }

  dihedralAngle() {
    const midpoint = this.midpoint();
    const [c1, c2] = this.adjacentFaces().map(face =>
      face.centroid().sub(midpoint),
    );

    if (!c1 || !c2) {
      throw new Error(`This edge is not connected to two faces.`);
    }

    return c1.angleBetween(c2, true);
  }

  equals(edge: Edge) {
    return this.v1.equals(edge.v1) && this.v2.equals(edge.v2);
  }
}
