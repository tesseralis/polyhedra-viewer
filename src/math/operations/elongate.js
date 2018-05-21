// @flow strict
import _ from 'lodash';
import { type Twist } from 'types';
import { Polyhedron, Peak } from 'math/polyhedra';
import { withOrigin } from 'math/linAlg';
import { mod } from 'util.js';
import {
  getTwistSign,
  antiprismHeight,
  getTransformedVertices,
  getEdgeFacePaths,
} from './operationUtils';

function duplicateVertices(polyhedron: Polyhedron, boundary, twist?: Twist) {
  const newVertexMapping = {};
  _.forEach(boundary.edges, (edge, i) => {
    const oppositeFace = edge.twin().face;
    _.forEach(edge.vertices, (v, j) => {
      _.set(
        newVertexMapping,
        [oppositeFace.index, v.index],
        polyhedron.numVertices() + mod(i + j, boundary.numSides),
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

// TODO add twist option to elongate
function doElongate(polyhedron, twist) {
  const peaks = Peak.getAll(polyhedron);
  const boundary = peaks[0].boundary();
  const n = boundary.numSides;
  const duplicated = duplicateVertices(polyhedron, boundary, twist);
  const [transformVertices, multiplier] = (() => {
    const duplicatedPeaks = Peak.getAll(duplicated);
    if (duplicatedPeaks.length === 2) {
      return [duplicatedPeaks, 1 / 2];
    } else {
      // Otherwise it's the largest face
      const base = boundary.adjacentFaces()[0].withPolyhedron(duplicated);
      return [[base], 1];
    }
  })();

  const height = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1);
  const angle = getTwistSign(twist) * Math.PI / n;

  const endVertices = getTransformedVertices(transformVertices, set =>
    withOrigin(set.normalRay(), v =>
      v
        .add(set.normal().scale(height * multiplier))
        .getRotatedAroundAxis(set.normal(), angle * multiplier),
    ),
  );
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export function elongate(polyhedron: Polyhedron) {
  return doElongate(polyhedron);
}

export function gyroelongate(polyhedron: Polyhedron) {
  return doElongate(polyhedron, 'left');
}
