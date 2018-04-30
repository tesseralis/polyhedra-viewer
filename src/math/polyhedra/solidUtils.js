// @flow
import _ from 'lodash';
import type { Vertex, VIndex, Face } from './solidTypes';

// Get the element of the array at the given index,
// modulo its length
function mod(a, b) {
  return a >= 0 ? a % b : a % b + b;
}

// Return the number of sides of a face
export const numSides = (face: Face) => face.length;

export function getCyclic(array: number[], index: number): number {
  return array[mod(index, array.length)];
}

export function getDirectedEdges(face: Face) {
  return _.map(face, (vertex: Vertex, index: VIndex) => {
    return [vertex, getCyclic(face, index + 1)];
  });
}

export function nextVertex(face: Face, vIndex: VIndex) {
  return getCyclic(face, face.indexOf(vIndex) + 1);
}

export function prevVertex(face: Face, vIndex: VIndex) {
  return getCyclic(face, face.indexOf(vIndex) - 1);
}
