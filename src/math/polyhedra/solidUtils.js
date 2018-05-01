// @flow
import _ from 'lodash';
import type { Vertex, VIndex, Face } from './solidTypes';

export function mod(a: number, b: number) {
  return a >= 0 ? a % b : a % b + b;
}

// Return the number of sides of a face
export const numSides = (face: Face) => face.length;

// Get the element of the array at the given index,
// modulo its length
export function getCyclic<T>(array: T[], index: number): T {
  return array[mod(index, array.length)];
}

export function getDirectedEdges(face: Face) {
  return _.map(face, (vertex: Vertex, index: VIndex) => {
    return [vertex, getCyclic(face, index + 1)];
  });
}
