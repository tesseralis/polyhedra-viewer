// @flow strict
import _ from 'lodash';

import { Polyhedron } from 'math/polyhedra';
import type { Operation } from '../operationTypes';

interface sharpenOptions {
  faceType?: number;
}

// Return the symmetry group of the *rectified* polyhedron
function getFamily(polyhedron) {
  // The octahedron is the rectification of the tetrahedron;
  // Otherwise rely on polyhedral symmetry
  return polyhedron.isRegular() ? 'T' : polyhedron.symmetry();
}

// Adjacent faces of the vertex with a sharpen face first
function getShiftedAdjacentFaces(vertex, facesTosharpen) {
  const adjFaces = vertex.adjacentFaces();
  const [first, ...last] = adjFaces;
  if (first.inSet(facesTosharpen)) {
    return adjFaces;
  }
  return [...last, first];
}

function duplicateVertices(polyhedron, facesTosharpen) {
  const offset = polyhedron.numVertices();
  const mapping = {};
  _.forEach(polyhedron.vertices, vertex => {
    const v = vertex.index;
    const v2 = v + offset;
    const values = [v, [v2, v], v2, [v, v2]];

    const faces = getShiftedAdjacentFaces(vertex, facesTosharpen);
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

function getsharpenFaces(polyhedron, faceType) {
  // Special octahedron case
  if (polyhedron.isRegular()) {
    const face0 = polyhedron.getFace();
    const adjacentFaces = face0.adjacentFaces();
    return _.filter(face0.vertexAdjacentFaces(), f => !f.inSet(adjacentFaces));
  }

  return _.filter(polyhedron.faces, { numSides: faceType });
}

function calculatesharpenDist(polyhedron, face, edge) {
  const apothem = face.apothem();
  const theta = Math.PI - edge.dihedralAngle();
  return apothem * Math.tan(theta);
}

function getsharpenDist(polyhedron, face) {
  if (!polyhedron.isRegular() && !polyhedron.isQuasiRegular()) {
    return _.meanBy(face.edges, edge =>
      calculatesharpenDist(polyhedron, face, edge),
    );
  }
  return calculatesharpenDist(polyhedron, face, face.edges[0]);
}

function getVertexToAdd(polyhedron, face) {
  const dist = getsharpenDist(polyhedron, face);
  return face.normalRay().getPointAtDistance(dist);
}

function applysharpen(
  polyhedron: Polyhedron,
  { faceType = polyhedron.smallestFace().numSides }: sharpenOptions = {},
) {
  // face indices with the right number of sides
  let sharpenFaces = getsharpenFaces(polyhedron, faceType);

  let mock;
  if (polyhedron.isQuasiRegular()) {
    mock = duplicateVertices(polyhedron, sharpenFaces);
    sharpenFaces = sharpenFaces.map(face => face.withPolyhedron(mock));
  } else {
    mock = polyhedron;
  }

  const verticesToAdd = sharpenFaces.map(face => getVertexToAdd(mock, face));

  const oldToNew = {};
  sharpenFaces.forEach((face, i) => {
    face.vertices.forEach(v => {
      oldToNew[v.index] = i;
    });
  });

  const endVertices = mock.vertices.map(
    (v, vIndex) =>
      _.has(oldToNew, vIndex.toString())
        ? verticesToAdd[oldToNew[vIndex]]
        : v.vec,
  );

  return {
    animationData: {
      start: mock,
      endVertices,
    },
  };
}

export const sharpen: Operation<sharpenOptions> = {
  apply: applysharpen,

  getSearchOptions(polyhedron, config) {
    const { faceType } = config;
    if (!polyhedron.isQuasiRegular()) {
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

  getAllOptions(polyhedron) {
    if (!polyhedron.isQuasiRegular()) {
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

  hitOption: 'faceType',
  getHitOption(polyhedron, hitPoint) {
    const n = polyhedron.hitFace(hitPoint).numSides;
    return n <= 5 ? { faceType: n } : {};
  },

  getSelectState(polyhedron, { faceType }) {
    return _.map(polyhedron.faces, face => {
      if (_.isNumber(faceType) && face.numSides === faceType) return 'selected';
      return 'selectable';
    });
  },
};
