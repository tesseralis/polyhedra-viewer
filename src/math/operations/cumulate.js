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

// Return the symmetry group of the *rectified* polyhedron
function getFamily(polyhedron) {
  switch (polyhedron.numFaces()) {
    case 8: // octahedron
      return 'T';
    case 14: // cuboctahedron
      return 'O';
    case 32: // icosidodecahedron
      return 'I';
    default:
      throw new Error('Did you try to cumulate an invalid solid?');
  }
}

// Return if the polyhedron is rectified
function isRectified(polyhedron) {
  return polyhedron.adjacentFaces(0).length === 4;
}

function isBevelled(polyhedron) {
  return polyhedron.faceTypes().length === 3;
}

function duplicateVertex(newPolyhedron, polyhedron, faces, vIndex) {
  const adjacentFaces = polyhedron.adjacentFaces(vIndex);
  const pivot = find(adjacentFaces, nbr => nbr.inSet(faces));
  const newVertexIndex = newPolyhedron.numVertices();

  return newPolyhedron
    .addVertices([newPolyhedron.vertices[vIndex]])
    .mapFaces(face => {
      const originalFace = face.withPolyhedron(polyhedron);
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
    _.every(polyhedron.getFaces(), { numSides: 3 })
  ) {
    const face0 = polyhedron.getFace();

    return polyhedron
      .getFaces()
      .filter(
        face =>
          _.intersection(face.vIndices(), face0.vIndices()).length % 2 === 0,
      );
  }

  return _.filter(polyhedron.getFaces(), { numSides: faceType });
}

function calculateCumulateDist(polyhedron, face, edge) {
  const apothem = face.apothem();
  const theta = Math.PI - edge.dihedralAngle();
  return apothem * Math.tan(theta);
}

function getCumulateDist(polyhedron, face) {
  if (isBevelled(polyhedron)) {
    return _.meanBy(face.edges(), edge =>
      calculateCumulateDist(polyhedron, face, edge),
    );
  }
  return calculateCumulateDist(polyhedron, face, face.edges()[0]);
}

function getVertexToAdd(polyhedron, face) {
  const normalRay = face.normalRay();
  const dist = getCumulateDist(polyhedron, face);
  return normalRay.getPointAtDistance(dist).toArray();
}

function applyCumulate(
  polyhedron: Polyhedron,
  { faceType }: CumulateOptions = {},
) {
  // face indices with the right number of sides
  const n = faceType || _.min(polyhedron.getFaces().map(face => face.numSides));
  let cumulateFaces = getCumulateFaces(polyhedron, n);

  if (isRectified(polyhedron)) {
    polyhedron = duplicateVertices(polyhedron, cumulateFaces);
    cumulateFaces = cumulateFaces.map(face => face.withPolyhedron(polyhedron));
  }
  const { vertices } = polyhedron;

  const verticesToAdd = cumulateFaces.map(face =>
    getVertexToAdd(polyhedron, face),
  );

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
  const result = deduplicateVertices(polyhedron.withVertices(endVertices));

  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
    result,
  };
}

export const cumulate: Operation<CumulateOptions> = {
  apply: applyCumulate,

  getSearchOptions(polyhedron, config) {
    const { faceType } = config;
    if (!isRectified(polyhedron)) {
      return {};
    }
    switch (getFamily(polyhedron)) {
      case 'O':
        return { value: faceType === 3 ? 'C' : 'O' };
      case 'I':
        return { value: faceType === 3 ? 'D' : 'I' };
      default:
        return {};
    }
  },

  getAllApplyArgs(polyhedron) {
    if (!isRectified(polyhedron)) {
      return [{}];
    }
    switch (getFamily(polyhedron)) {
      case 'O':
        return [{ faceType: 3 }, { faceType: 4 }];
      case 'I':
        return [{ faceType: 3 }, { faceType: 5 }];
      default:
        return [{}];
    }
  },

  getApplyArgs(polyhedron, hitPnt) {
    const hitPoint = vec(hitPnt);
    const n = polyhedron.hitFace(hitPoint).numSides;
    return n <= 5 ? { faceType: n } : {};
  },

  isHighlighted(polyhedron, applyArgs, face) {
    if (
      _.isNumber(applyArgs.faceType) &&
      face.numSides === applyArgs.faceType
    ) {
      return true;
    }
  },
};
