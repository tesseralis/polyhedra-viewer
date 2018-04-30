// @flow
import _ from 'lodash';

import { find } from 'util.js';
import { vec } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';
import { deduplicateVertices } from './operationUtils';
import type { Operation } from './operationTypes';

interface CumulateOptions {
  faceType?: number;
}

// Return if the polyhedron is rectified
function isRectified(polyhedron) {
  return polyhedron.adjacentFaces(0).length === 4;
}

// function duplicateVertex(newPolyhedron, polyhedron, fIndices, vIndex) {
function duplicateVertex(newPolyhedron, polyhedron, faces, vIndex) {
  const adjacentFaces = polyhedron.adjacentFaces(vIndex);
  const pivot = find(adjacentFaces, nbr => nbr.inSet(faces));
  const newVertexIndex = newPolyhedron.numVertices();

  return newPolyhedron
    .addVertices([newPolyhedron.vertices[vIndex]])
    .mapFaces(face => {
      const originalFace = polyhedron.getFace(face.fIndex);
      if (!face.inSet(adjacentFaces)) {
        return face.vIndices();
      }

      // If this is the pivot face, return unchanged
      if (face.equals(pivot)) {
        return face.vIndices();
      }

      // If this is the *other* cumulated face, use the duplicated vertex
      if (face.inSet(faces)) {
        return face.replaceVertex(vIndex, newVertexIndex);
      }

      // If this is the face next to the pivot, insert the duplicated point to the left of the pivot
      if (_.includes(originalFace.vIndices(), pivot.nextVertex(vIndex))) {
        return face.replaceVertex(vIndex, vIndex, newVertexIndex);
      }

      if (_.includes(originalFace.vIndices(), pivot.prevVertex(vIndex))) {
        return face.replaceVertex(vIndex, newVertexIndex, vIndex);
      }

      throw new Error('Cannot classify face');
    });
}

function duplicateVertices(polyhedron, facesToCumulate) {
  const { vertices, faces } = polyhedron.vertices.reduce(
    (newPolyhedron, vertex, vIndex) => {
      return duplicateVertex(
        newPolyhedron,
        polyhedron,
        facesToCumulate,
        vIndex,
      );
    },
    polyhedron,
  );
  // Create a new one so we recalculate the edges
  return Polyhedron.of(vertices, faces);
}

// function cumulateFaceIndices(polyhedron, faceType) {
function getCumulateFaces(polyhedron, faceType) {
  // Special octahedron case
  if (
    polyhedron.numFaces() === 8 &&
    _.every(polyhedron.getFaces(), face => face.numSides() === 3)
  ) {
    // const face = polyhedron.faces[0];
    const face0 = polyhedron.getFace(0);

    return polyhedron
      .getFaces()
      .filter(
        face =>
          _.intersection(face.vIndices(), face0.vIndices()).length % 2 === 0,
      );
  }

  return polyhedron.getFaces().filter(face => face.numSides() === faceType);
}

function applyCumulate(
  polyhedron: Polyhedron,
  { faceType }: CumulateOptions = {},
) {
  // face indices with the right number of sides
  const n =
    faceType || _.min(polyhedron.getFaces().map(face => face.numSides()));
  let cumulateFaces = getCumulateFaces(polyhedron, n);

  if (isRectified(polyhedron)) {
    polyhedron = duplicateVertices(polyhedron, cumulateFaces);
    cumulateFaces = cumulateFaces.map(face => polyhedron.getFace(face.fIndex));
  }
  const { vertices } = polyhedron;

  const verticesToAdd = cumulateFaces.map(face => {
    const apothem = face.apothem();
    const normal = face.normal();
    const centroid = face.centroid();
    const theta =
      Math.PI - polyhedron.getDihedralAngle(_.take(face.vIndices(), 2));
    const scale = apothem * Math.tan(theta);
    return centroid.add(normal.scale(scale)).toArray();
  });

  const oldToNew = {};
  cumulateFaces.forEach((face, i) => {
    face.vIndices().forEach(vIndex => {
      oldToNew[vIndex] = i;
    });
  });

  const endVertices = vertices.map(
    (vertex, vIndex) =>
      _.has(oldToNew, vIndex.toString())
        ? verticesToAdd[oldToNew[vIndex]]
        : vertex,
  );

  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
    result: deduplicateVertices(polyhedron.withVertices(endVertices)),
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

  isHighlighted(polyhedron, applyArgs, face) {
    if (
      _.isNumber(applyArgs.faceType) &&
      face.numSides() === applyArgs.faceType
    ) {
      return true;
    }
  },
};
