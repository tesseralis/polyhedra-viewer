// @flow
import _ from 'lodash';

import { replace } from 'util.js';
import { vec } from 'math/linAlg';
import { Polyhedron, Face } from 'math/polyhedra';
import { numSides, prevVertex, nextVertex } from 'math/polyhedra/solidUtils';
import { deduplicateVertices } from './operationUtils';
import type { Operation } from './operationTypes';

interface CumulateOptions {
  faceType?: number;
}

// Return if the polyhedron is rectified
function isRectified(polyhedron) {
  return polyhedron.adjacentFaces(0).length === 4;
}

function duplicateVertex(newPolyhedron, polyhedron, fIndices, vIndex) {
  const adjacentFaces = polyhedron.adjacentFaces(vIndex);
  const pivot: Face = _.find(adjacentFaces, face =>
    _.includes(fIndices, face.fIndex),
  );
  const pivotFace = pivot.vIndices();
  const newVertexIndex = newPolyhedron.numVertices();

  return newPolyhedron
    .addVertices([newPolyhedron.vertices[vIndex]])
    .mapFaces((face, fIndex) => {
      const originalFace = polyhedron.faces[fIndex];
      if (!_.includes(_.map(adjacentFaces, face => face.fIndex), fIndex)) {
        return face;
      }

      // If this is the pivot face, return unchanged
      if (fIndex === pivot.fIndex) {
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
    .filter(fIndex => polyhedron.getFace(fIndex).numSides() === faceType);
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
    const face = polyhedron.getFace(fIndex);
    const apothem = face.apothem();
    const normal = face.normal();
    const centroid = face.centroid();
    const theta =
      Math.PI - polyhedron.getDihedralAngle(_.take(face.vIndices(), 2));
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
    const n = polyhedron.hitFace(hitPoint).numSides();
    return n <= 5 ? { faceType: n } : {};
  },

  isHighlighted(polyhedron, applyArgs, fIndex) {
    if (
      _.isNumber(applyArgs.faceType) &&
      polyhedron.getFace(fIndex).numSides() === applyArgs.faceType
    ) {
      return true;
    }
  },
};
