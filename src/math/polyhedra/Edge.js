// @flow
import { getMidpoint } from 'math/linAlg';
import Polyhedron from './Polyhedron';
import { VIndex } from './solidTypes';
import Vertex from './Vertex';

export default class Edge {
  polyhedron: Polyhedron;
  a: VIndex;
  b: VIndex;
  va: Vertex;
  vb: Vertex;

  constructor(polyhedron: Polyhedron, a: VIndex, b: VIndex) {
    this.polyhedron = polyhedron;
    this.a = a;
    this.b = b;
    this.va = polyhedron.vertexObjs[a];
    this.vb = polyhedron.vertexObjs[b];
  }

  length() {
    return this.va.value.distanceTo(this.vb.value);
  }

  twin() {
    return new Edge(this.polyhedron, this.b, this.a);
  }

  // Get the faces adjacent to this edge, with the directed face first
  adjacentFaces() {
    const { a, b } = this;
    const graph = this.polyhedron.directedEdgeToFaceGraph();
    return [graph[a][b], graph[b][a]];
  }

  dihedralAngle() {
    const midpoint = getMidpoint(this.va.value, this.vb.value);
    const [c1, c2] = this.adjacentFaces().map(face =>
      face.centroid().sub(midpoint),
    );

    if (!c1 || !c2) {
      throw new Error(`This edge is not connected to two faces.`);
    }

    return c1.angleBetween(c2, true);
  }
}
