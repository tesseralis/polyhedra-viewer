// @flow
import { Vec3D } from 'toxiclibsjs/geom';
import { VIndex } from './solidTypes';
import Polyhedron from './Polyhedron';

export default class Vertex {
  polyhedron: Polyhedron;
  index: VIndex;
  value: Vec3D;

  constructor(polyhedron: Polyhedron, index: VIndex) {
    this.polyhedron = polyhedron;
    this.index = index;
    this.value = polyhedron.vertexVector(index);
  }
}
