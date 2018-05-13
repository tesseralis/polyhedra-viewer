// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';
import { find } from 'util.js';
import { vec } from 'math/linAlg';
import { VIndex } from './solidTypes';
import Polyhedron from './Polyhedron';

export default class Vertex {
  polyhedron: Polyhedron;
  index: VIndex;
  value: number[];
  vec: Vec3D;

  constructor(polyhedron: Polyhedron, index: VIndex) {
    this.polyhedron = polyhedron;
    this.index = index;
    this.value = polyhedron.vertices[index];
    this.vec = vec(this.value);
  }

  equals(other: Vertex) {
    return this.index === other.index;
  }

  inSet(vertices: Vertex[]) {
    return _.some(vertices, vertex => this.equals(vertex));
  }

  adjacentVertices() {
    return this.polyhedron.vertexGraph()[this.index];
  }

  adjacentFaces() {
    return this.polyhedron.vertexToFaceGraph()[this.index];
  }

  directedAdjacentFaces() {
    const touchingFaces = this.adjacentFaces();
    const result = [];
    let next = touchingFaces[0];
    const checkVertex = f =>
      next.prevVertex(this.index) === f.nextVertex(this.index);
    do {
      result.push(next);
      next = find(touchingFaces, checkVertex);
    } while (result.length < touchingFaces.length);
    return result;
  }
}
