
import _ from 'lodash';
import { Cap } from 'math/polyhedra';
import { getEdgeFacePaths } from '../operationUtils';
import makeOperation from '../makeOperation';
import { antiprismHeight, getScaledPrismVertices } from './prismUtils';

function duplicateVertices(polyhedron, boundary, twist) {
  const newVertexMapping = {};
  _.forEach(boundary.edges, (edge, i) => {
    const oppositeFace = edge.twin().face;
    _.forEach(edge.vertices, (v, j) => {
      _.set(
        newVertexMapping,
        [oppositeFace.index, v.index],
        polyhedron.numVertices() + ((i + j) % boundary.numSides),
      );
    });
  });

  return polyhedron.withChanges(solid =>
    solid
      .addVertices(boundary.vertices)
      .mapFaces(face =>
        face.vertices.map(v =>
          _.get(newVertexMapping, [face.index, v.index], v.index),
        ),
      )
      .addFaces(
        _.flatMap(boundary.edges, edge =>
          _.map(getEdgeFacePaths(edge, twist), face =>
            _.map(face, path => _.get(newVertexMapping, path, path[1])),
          ),
        ),
      ),
  );
}

function doElongate(polyhedron, twist) {
  const caps = Cap.getAll(polyhedron);
  const boundary = caps[0].boundary();
  const n = boundary.numSides;
  const duplicated = duplicateVertices(polyhedron, boundary, twist);
  const [vertexSets, multiplier] = (() => {
    const duplicatedCaps = Cap.getAll(duplicated);
    if (duplicatedCaps.length === 2) {
      return [duplicatedCaps, 1 / 2];
    } else {
      // Otherwise it's the largest face
      const base = boundary.adjacentFaces()[0].withPolyhedron(duplicated);
      return [[base], 1];
    }
  })();
  const adjustInfo = { vertexSets, boundary, multiplier };

  const height = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1);

  const endVertices = getScaledPrismVertices(adjustInfo, height, twist);
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export const elongate = makeOperation('elongate', polyhedron => {
  return doElongate(polyhedron);
});

export const gyroelongate = makeOperation('gyroelongate', {
  apply(polyhedron, { twist = 'left' }) {
    return doElongate(polyhedron, twist);
  },
  optionTypes: ['twist'],
  allOptionCombos(polyhedron) {
    return [{ twist: 'left' }, { twist: 'right' }];
  },
});
