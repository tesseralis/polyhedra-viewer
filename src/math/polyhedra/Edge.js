// @flow
import { getMidpoint } from 'math/linAlg';
import Polyhedron from './Polyhedron';
import { VIndex } from './solidTypes';
import Vertex from './Vertex';

export default class Edge {
  polyhedron: Polyhedron;
  a: VIndex;
  b: VIndex;
  id: string;
  va: Vertex;
  vb: Vertex;

  constructor(polyhedron: Polyhedron, a: VIndex, b: VIndex) {
    this.polyhedron = polyhedron;
    this.a = a;
    this.b = b;
    this.id = `${a},${b}`;
    this.va = polyhedron.vertexObjs[a];
    this.vb = polyhedron.vertexObjs[b];
  }

  get vertices() {
    return [this.va, this.vb];
  }

  length() {
    return this.va.vec.distanceTo(this.vb.vec);
  }

  midpoint() {
    return getMidpoint(this.va.vec, this.vb.vec);
  }

  twin() {
    return new Edge(this.polyhedron, this.b, this.a);
  }

  // Get the faces adjacent to this edge, with the directed face first
  adjacentFaces() {
    const { a, b } = this;
    const graph = this.polyhedron.edgeToFaceGraph();
    return [graph[a][b], graph[b][a]];
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
}
