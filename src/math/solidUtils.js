// @flow
import _ from 'lodash';
import type { Vertex, VIndex, Face, FIndex, Edge } from './solidTypes';

// Get the element of the array at the given index,
// modulo its length
function mod(a, b) {
  return a >= 0 ? a % b : a % b + b;
}
export function getCyclic(array: number[], index: number): number {
  return array[mod(index, array.length)];
}

// Return the number of sides of a face
export const numSides = (face: Face) => face.length;

export function getDirectedEdges(face: Face) {
  return _.map(face, (vertex: Vertex, index: VIndex) => {
    return [vertex, getCyclic(face, index + 1)];
  });
}

// Get a "face" (list of vertices) representing the boundary of the given faces
export function getBoundary(faces: Face[]) {
  const edges = {};
  // build up a lookup table for every pair of edges to that face
  _.forEach(faces, (face: Face, index: FIndex) => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    _.forEach(getDirectedEdges(face), edge => {
      const [i1, i2] = edge;
      if (_.includes(edges[i2], i1)) {
        _.pull(edges[i2], i1);
      } else {
        if (!edges[i1]) {
          edges[i1] = [];
        }
        edges[i1].push(i2);
      }
    });
  });

  const cycle = _(edges)
    .pickBy('length')
    .mapValues(0)
    .value();
  const first = _.values(cycle)[0];
  const result = [first];
  for (let i = cycle[first]; i !== first; i = cycle[i]) {
    result.push(i);
  }
  return result;
}

export function nextVertex(face: Face, vIndex: VIndex) {
  return getCyclic(face, face.indexOf(vIndex) + 1);
}

export function prevVertex(face: Face, vIndex: VIndex) {
  return getCyclic(face, face.indexOf(vIndex) - 1);
}

export function hasEdge(face: Face, [v1, v2]: Edge) {
  return _.includes(face, v1) && _.includes(face, v2);
}
