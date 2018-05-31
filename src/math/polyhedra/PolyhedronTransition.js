// @flow strict
import { interpolate } from 'd3-interpolate';
import type { Point } from 'types';
import Polyhedron from './Polyhedron';
import { type VertexArg } from './SolidBuilder';

export default class PolyhedronTransition {
  polyhedron: Polyhedron;
  interpolateVertices: (t: number) => VertexArg[];
  // TODO call duplicate result from here
  result: Polyhedron;

  constructor(
    polyhedron: Polyhedron,
    endVertices: VertexArg[],
    result: Polyhedron,
  ) {
    this.polyhedron = polyhedron;
    this.interpolateVertices = interpolate(
      polyhedron.solidData.vertices,
      endVertices,
    );
    this.result = result;
  }

  at(t: number) {
    return this.polyhedron.withVertices(this.interpolateVertices(t));
  }
}
