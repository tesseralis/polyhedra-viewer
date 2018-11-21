import _ from 'lodash';
import { Point } from 'types';
import { vec, Vec3D } from 'math/geom';
import { VIndex } from './solidTypes';
import Polyhedron from './Polyhedron';
import Edge from './Edge';

function getCycles<T>(array: T[]) {
  return _.map(array, (val, i) => _.drop(array, i).concat(_.take(array, i)));
}

function arrayMin<T>(a1: T[], a2: T[]): T[] {
  if (a1.length === 0) return a1;
  if (a2.length === 0) return a2;
  const [h1, ...t1] = a1;
  const [h2, ...t2] = a2;
  if (h1 < h2) return a1;
  if (h2 < h1) return a2;
  return [h1, ...arrayMin(t1, t2)];
}

export default class Vertex {
  polyhedron: Polyhedron;
  index: VIndex;
  value: Point;
  vec: Vec3D;

  constructor(polyhedron: Polyhedron, index: VIndex) {
    this.polyhedron = polyhedron;
    this.index = index;
    this.value = polyhedron._solidData.vertices[index];
    this.vec = vec(this.value);
  }

  equals(other: Vertex) {
    return this.index === other.index;
  }

  inSet(vertices: Vertex[]) {
    return _.some(vertices, vertex => this.equals(vertex));
  }

  adjacentEdges() {
    // find an edge with this as a source
    const v2 = parseInt(
      _.findKey(this.polyhedron.edgeToFaceGraph()[this.index])!,
    );
    const e0 = new Edge(this, this.polyhedron.vertices[v2]);
    let e = e0;
    const result = [];
    let count = 0;
    do {
      count++;
      result.push(e);
      e = e.prev().twin();
      if (count > 10) throw new Error('we done messed up');
    } while (!e.equals(e0));
    return result;
  }

  adjacentVertices() {
    return _.map(this.adjacentEdges(), 'v2');
  }

  adjacentFaces() {
    return _.map(this.adjacentEdges(), 'face');
  }

  configuration() {
    const config = _.map(this.adjacentFaces(), 'numSides');
    const allConfigs = getCycles(config).concat(
      getCycles(_.reverse([...config])),
    );
    return _.reduce(allConfigs, arrayMin)!;
  }

  /** Return adjacent faces counted by number of sides */
  adjacentFaceCounts() {
    return _.countBy(this.adjacentFaces(), 'numSides');
  }
}

export interface VertexList {
  readonly vertices: Vertex[];
  // TODO make this a more generic thing?
  readonly polyhedron: Polyhedron;
}
