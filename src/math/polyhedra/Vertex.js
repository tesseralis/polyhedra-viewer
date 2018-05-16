// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';
import { vec } from 'math/linAlg';
import { VIndex } from './solidTypes';
import Polyhedron from './Polyhedron';
import Edge from './Edge';

export default class Vertex {
  polyhedron: Polyhedron;
  index: VIndex;
  value: number[];
  vec: Vec3D;

  constructor(polyhedron: Polyhedron, index: VIndex) {
    this.polyhedron = polyhedron;
    this.index = index;
    this.value = polyhedron.solidData.vertices[index];
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
    const v2 = _.findIndex(this.polyhedron.edgeToFaceGraph()[this.index]);
    const e0 = new Edge((this: any), this.polyhedron.vertices[v2]);
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
}
