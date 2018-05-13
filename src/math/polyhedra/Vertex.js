// @flow
import { Vec3D } from 'toxiclibsjs/geom';
import { find } from 'util.js';
import { VIndex } from './solidTypes';
import Polyhedron from './Polyhedron';

export default class Vertex {
  polyhedron: Polyhedron;
  index: VIndex;
  value: Vec3D;
  vec: Vec3D;

  constructor(polyhedron: Polyhedron, index: VIndex) {
    this.polyhedron = polyhedron;
    this.index = index;
    this.value = polyhedron.vertexVector(index);
    this.vec = this.value;
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
