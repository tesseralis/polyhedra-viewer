import _ from 'lodash';
import { Twist } from 'types';
import { Polyhedron, Cap, VEList, VertexList } from 'math/polyhedra';
import { getEdgeFacePaths } from '../operationUtils';
import makeOperation from '../makeOperation';
import { antiprismHeight, getScaledPrismVertices } from './prismUtils';

function duplicateVertices(
  polyhedron: Polyhedron,
  boundary: VEList,
  twist?: Twist,
) {
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

function doElongate(polyhedron: Polyhedron, twist?: Twist) {
  const caps = Cap.getAll(polyhedron);
  const boundary = caps[0].boundary();
  const n = boundary.numSides;
  const duplicated = duplicateVertices(polyhedron, boundary, twist);
  let vertexSets: VertexList[];
  let multiplier: number;

  const duplicatedCaps = Cap.getAll(duplicated);
  if (duplicatedCaps.length === 2) {
    vertexSets = duplicatedCaps;
    multiplier = 1 / 2;
  } else {
    // Otherwise it's the largest face
    vertexSets = [boundary.adjacentFaces()[0].withPolyhedron(duplicated)];
    multiplier = 1;
  }
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

export const elongate = makeOperation('elongate', {
  apply(polyhedron) {
    return doElongate(polyhedron);
  },
});

interface Options {
  twist?: Twist;
}
export const gyroelongate = makeOperation('gyroelongate', {
  apply(polyhedron: Polyhedron, { twist = 'left' }: Options) {
    return doElongate(polyhedron, twist);
  },
  optionTypes: ['twist'],
  allOptionCombos(polyhedron: Polyhedron) {
    return [{ twist: 'left' }, { twist: 'right' }];
  },
});
