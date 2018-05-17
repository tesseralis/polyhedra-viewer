// @flow strict
import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import {
  getSnubAngle,
  expansionType,
  isExpandedFace,
  getResizedVertices,
} from './operationUtils';
import { flatMap, repeat } from 'util.js';
import { Operation } from './operationTypes';

// Result functions
// ================
// Since there are only a handful of possibilities for these oprations, it's okay to use shortcuts
// like switching on number of faces, to determine properties.

function getExpansionResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'cuboctahedron';
    case 6:
    case 8:
      return 'rhombicuboctahedron';
    case 12:
    case 20:
      return 'rhombicosidodecahedron';
    default:
      throw new Error('Did you try to expand a non-regular solid?');
  }
}

function getSnubResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'icosahedron';
    case 6:
    case 8:
      return 'snub cube';
    case 12:
    case 20:
      return 'snub dodecahedron';
    default:
      throw new Error('Did you try to snub a non-regular solid?');
  }
}

function getEdgeFacePaths(edge, twist) {
  const [v1, v2] = _.map(edge.vertices, 'index');
  const [f1, f2] = _.map(edge.adjacentFaces(), 'index');
  switch (twist) {
    case 'right':
      return [
        [[f1, v1], [f2, v2], [f1, v2]], // face 1
        [[f1, v1], [f2, v1], [f2, v2]], // face 2
      ];
    case 'left':
      return [
        [[f1, v2], [f1, v1], [f2, v1]], // face 1
        [[f2, v1], [f2, v2], [f1, v2]], // face 2
      ];
    default:
      return [[[f1, v2], [f1, v1], [f2, v1], [f2, v2]]];
  }
}

function duplicateVertices(polyhedron: Polyhedron, twist?: 'left' | 'right') {
  const count = polyhedron.getVertex().adjacentFaces().length;

  const newVertexMapping = {};
  _.forEach(polyhedron.vertices, (v, vIndex: number) => {
    // For each vertex, pick one adjacent face to be the "head"
    // for every other adjacent face, map it to a duplicated vertex
    _.forEach(v.adjacentFaces(), (f, i) => {
      _.set(newVertexMapping, [f.index, v.index], v.index * count + i);
    });
  });

  return polyhedron.withChanges(solid =>
    solid
      .withVertices(flatMap(polyhedron.vertices, v => repeat(v.value, count)))
      .mapFaces(face =>
        face.vertices.map(v => newVertexMapping[face.index][v.index]),
      )
      .addFaces(
        _.map(polyhedron.vertices, v =>
          _.range(v.index * count, (v.index + 1) * count),
        ),
      )
      .addFaces(
        _.flatMap(polyhedron.edges, edge =>
          _.map(getEdgeFacePaths(edge, twist), face =>
            _.map(face, path => _.get(newVertexMapping, path)),
          ),
        ),
      ),
  );
}

function getTwist(angle) {
  if (angle > 0) {
    return 'right';
  } else if (angle < 0) {
    return 'left';
  }
}

function doExpansion(polyhedron: Polyhedron, referenceName) {
  const reference = Polyhedron.get(referenceName);
  const type = expansionType(reference);
  const n = polyhedron.getFace().numSides;
  const angle = type === 'snub' ? getSnubAngle(reference, n) : 0;
  const duplicated = duplicateVertices(polyhedron, getTwist(angle));

  const referenceFace =
    _.find(reference.faces, face => isExpandedFace(reference, face, n)) ||
    reference.getFace();
  const referenceLength =
    referenceFace.distanceToCenter() / reference.edgeLength();

  const snubFaces = _.filter(duplicated.faces, face =>
    isExpandedFace(duplicated, face, n),
  );

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(
    duplicated,
    snubFaces,
    referenceLength,
    angle,
  );

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export const expand: Operation<> = {
  apply(polyhedron: Polyhedron) {
    return doExpansion(polyhedron, getExpansionResult(polyhedron));
  },
};

export const snub: Operation<> = {
  apply(polyhedron: Polyhedron) {
    return doExpansion(polyhedron, getSnubResult(polyhedron));
  },
};
