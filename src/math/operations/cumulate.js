// @flow
import _ from 'lodash';

import { Polyhedron } from 'math/polyhedra';
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
  return polyhedron.getVertex().adjacentFaces().length === 4;
}

function isBevelled(polyhedron) {
  return polyhedron.faceTypes().length === 3;
}

function getAdjacentFaces(vertex, facesToCumulate) {
  const adjFaces = vertex.adjacentFaces();
  const [first, ...last] = adjFaces;
  if (first.inSet(facesToCumulate)) {
    return adjFaces;
  }
  return [...last, first];
}

function duplicateVertices(polyhedron, facesToCumulate) {
  const offset = polyhedron.numVertices();
  const mapping = {};
  _.forEach(polyhedron.vertices, vertex => {
    const v = vertex.index;
    const v2 = v + offset;
    const values = [v, [v2, v], v2, [v, v2]];

    const faces = getAdjacentFaces(vertex, facesToCumulate);
    _.forEach(faces, (f, i) => {
      _.set(mapping, [f.index, v], values[i]);
    });
  });

  // Double the amount of vertices
  return polyhedron.withChanges(solid =>
    solid.addVertices(polyhedron.vertices).mapFaces(f => {
      return _.flatMapDeep(f.vertices, v => mapping[f.index][v.index]);
    }),
  );
}

function getCumulateFaces(polyhedron, faceType) {
  // Special octahedron case
  if (
    polyhedron.numFaces() === 8 &&
    _.every(polyhedron.faces, { numSides: 3 })
  ) {
    const face0 = polyhedron.getFace();
    const adjacentFaces = face0.adjacentFaces();
    return _.filter(face0.vertexAdjacentFaces(), f => !f.inSet(adjacentFaces));
  }

  return _.filter(polyhedron.faces, { numSides: faceType });
}

function calculateCumulateDist(polyhedron, face, edge) {
  const apothem = face.apothem();
  const theta = Math.PI - edge.dihedralAngle();
  return apothem * Math.tan(theta);
}

function getCumulateDist(polyhedron, face) {
  if (isBevelled(polyhedron)) {
    return _.meanBy(face.edges, edge =>
      calculateCumulateDist(polyhedron, face, edge),
    );
  }
  return calculateCumulateDist(polyhedron, face, face.edges[0]);
}

function getVertexToAdd(polyhedron, face) {
  const normalRay = face.normalRay();
  const dist = getCumulateDist(polyhedron, face);
  return normalRay.getPointAtDistance(dist);
}

function applyCumulate(
  polyhedron: Polyhedron,
  { faceType }: CumulateOptions = {},
) {
  // face indices with the right number of sides
  const n = faceType || _.min(polyhedron.faces.map(face => face.numSides));
  let cumulateFaces = getCumulateFaces(polyhedron, n);

  if (isRectified(polyhedron)) {
    polyhedron = duplicateVertices(polyhedron, cumulateFaces);
    cumulateFaces = cumulateFaces.map(face => face.withPolyhedron(polyhedron));
  }

  const verticesToAdd = cumulateFaces.map(face =>
    getVertexToAdd(polyhedron, face),
  );

  const oldToNew = {};
  cumulateFaces.forEach((face, i) => {
    face.vertices.forEach(v => {
      oldToNew[v.index] = i;
    });
  });

  const endVertices = polyhedron.vertices.map(
    (v, vIndex) =>
      _.has(oldToNew, vIndex.toString())
        ? verticesToAdd[oldToNew[vIndex]]
        : v.vec,
  );

  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
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

  getApplyArgs(polyhedron, hitPoint) {
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
