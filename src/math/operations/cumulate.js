// @flow
import _ from 'lodash';

import { replace } from 'util.js';
import { vec } from 'math/linAlg';
import Polyhedron from 'math/Polyhedron';
import { numSides, prevVertex, nextVertex } from 'math/solidUtils';
import type FIndex from 'math/solidtypes';
import { deduplicateVertices } from './operationUtils';
import type { Operation } from './operationTypes';

interface CumulateOptions {
  faceType?: number;
}

// Return if the polyhedron is rectified
function isRectified(polyhedron) {
  return polyhedron.adjacentFaceIndices(0).length === 4;
}

function duplicateVertex(newPolyhedron, polyhedron, fIndices, vIndex) {
  const adjacentFaceIndices = polyhedron.adjacentFaceIndices(vIndex);
  const pivot: FIndex = _.find(adjacentFaceIndices, fIndex =>
    _.includes(fIndices, fIndex),
  );
  const pivotFace = polyhedron.faces[pivot];
  const newVertexIndex = newPolyhedron.numVertices();

  return newPolyhedron
    .addVertices([newPolyhedron.vertices[vIndex]])
    .mapFaces((face, fIndex) => {
      const originalFace = polyhedron.faces[fIndex];
      if (!_.includes(adjacentFaceIndices, fIndex)) {
        return face;
      }

      // If this is the pivot face, return unchanged
      if (fIndex === pivot) {
        return face;
      }

      // If this is the *other* cumulated face, use the duplicated vertex
      if (_.includes(fIndices, fIndex)) {
        return replace(face, face.indexOf(vIndex), newVertexIndex);
      }

      // If this is the face next to the pivot, insert the duplicated point to the left of the pivot
      if (_.includes(originalFace, nextVertex(pivotFace, vIndex))) {
        return replace(face, face.indexOf(vIndex), vIndex, newVertexIndex);
      }

      if (_.includes(originalFace, prevVertex(pivotFace, vIndex))) {
        return replace(face, face.indexOf(vIndex), newVertexIndex, vIndex);
      }

      throw new Error('Cannot classify face');
    });
}

function duplicateVertices(polyhedron, fIndices) {
  const { vertices, faces } = polyhedron.vertices.reduce(
    (newPolyhedron, vertex, vIndex) => {
      return duplicateVertex(newPolyhedron, polyhedron, fIndices, vIndex);
    },
    polyhedron,
  );
  // Create a new one so we recalculate the edges
  return Polyhedron.of(vertices, faces);
}

function cumulateFaceIndices(polyhedron, faceType) {
  // Special octahedron case
  if (
    polyhedron.numFaces() === 8 &&
    _.every(polyhedron.faces, face => numSides(face) === 3)
  ) {
    const face = polyhedron.faces[0];
    return polyhedron
      .fIndices()
      .filter(
        fIndex =>
          _.intersection(polyhedron.faces[fIndex], face).length % 2 === 0,
      );
  }

  return polyhedron
    .fIndices()
    .filter(fIndex => polyhedron.numSides(fIndex) === faceType);
}

function applyCumulate(
  polyhedron: Polyhedron,
  { faceType }: CumulateOptions = {},
) {
  // face indices with the right number of sides
  const n = faceType || _.min(polyhedron.faces.map(numSides));
  const fIndices = cumulateFaceIndices(polyhedron, n);

  if (isRectified(polyhedron)) {
    polyhedron = duplicateVertices(polyhedron, fIndices);
  }
  const { vertices, faces } = polyhedron;

  const verticesToAdd = fIndices.map(fIndex => {
    const apothem = polyhedron.apothem(fIndex);
    const normal = polyhedron.faceNormal(fIndex);
    const centroid = polyhedron.faceCentroid(fIndex);
    const theta =
      Math.PI -
      polyhedron.getDihedralAngle(_.take(polyhedron.faces[fIndex], 2));
    const scale = apothem * Math.tan(theta);
    return centroid.add(normal.scale(scale)).toArray();
  });

  const oldToNew = {};
  fIndices.forEach((fIndex, i) => {
    faces[fIndex].forEach(vIndex => {
      oldToNew[vIndex] = i;
    });
  });

  const mockVertices = vertices.map(
    (vertex, vIndex) =>
      _.has(oldToNew, vIndex.toString())
        ? verticesToAdd[oldToNew[vIndex]]
        : vertex,
  );

  return {
    animationData: {
      start: polyhedron,
      endVertices: mockVertices,
    },
    result: deduplicateVertices(polyhedron.withVertices(mockVertices)),
  };
}

export const cumulate: Operation<CumulateOptions> = {
  apply: applyCumulate,

  getSearchOptions(polyhedron, config) {
    const { faceType } = config;
    if (polyhedron.name === 'cuboctahedron') {
      return { value: faceType === 3 ? 'C' : 'O' };
    } else if (polyhedron.name === 'icosidodecahedron') {
      return { value: faceType === 3 ? 'D' : 'I' };
    }
  },

  getAllApplyArgs(polyhedron) {
    if (polyhedron.name === 'cuboctahedron') {
      return [{ faceType: 3 }, { faceType: 4 }];
    } else if (polyhedron.name === 'icosidodecahedron') {
      return [{ faceType: 3 }, { faceType: 5 }];
    }
    return [{}];
  },

  getApplyArgs(polyhedron, hitPnt) {
    const hitPoint = vec(hitPnt);
    const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint);
    // TODO handle octahedron case
    const n = numSides(polyhedron.faces[hitFaceIndex]);
    return n <= 5 ? { faceType: n } : {};
  },

  isHighlighted(polyhedron, applyArgs, fIndex) {
    if (
      _.isNumber(applyArgs.faceType) &&
      polyhedron.numSides(fIndex) === applyArgs.faceType
    ) {
      return true;
    }
  },
};
