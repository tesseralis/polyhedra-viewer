// @flow
import _ from 'lodash';

import { Polyhedron } from 'math/polyhedra';
import { VIndex } from 'math/polyhedra';
import { nextVertex } from 'math/polyhedra/solidUtils';
import { replace } from 'util.js';
import { vec } from 'math/linAlg';
import {
  removeExtraneousVertices,
  deduplicateVertices,
} from './operationUtils';
import type { Operation } from './operationTypes';

interface TruncateOptions {
  mock?: boolean;
  rectify?: boolean;
}

function truncateVertex(
  newPolyhedron,
  polyhedron,
  vIndex,
  { mock, rectify } = {},
) {
  const touchingFaces = polyhedron.directedAdjacentFaces(vIndex);
  let verticesToAdd = touchingFaces.map(face => {
    if (mock) {
      return polyhedron.vertices[vIndex];
    }
    const next = nextVertex(face.vIndices(), vIndex);
    const p1 = vec(polyhedron.vertices[vIndex]);
    const p2 = vec(polyhedron.vertices[next]);
    const sideLength = p1.distanceTo(p2);
    if (rectify) {
      return p1.add(p2.sub(p1).scale(1 / 2)).toArray();
    }
    const n = face.numSides();
    const apothem =
      Math.cos(Math.PI / n) * sideLength / (2 * Math.sin(Math.PI / n));
    const n2 = 2 * n;
    const newSideLength =
      2 * Math.sin(Math.PI / n2) * apothem / Math.cos(Math.PI / n2);
    return p1
      .add(p2.sub(p1).scale((sideLength - newSideLength) / 2 / sideLength))
      .toArray();
  });

  const newVertices = newPolyhedron.vertices.concat(verticesToAdd);

  const mod = (a, b) => (a >= 0 ? a % b : a % b + b);

  const newFaces = newPolyhedron
    .getFaces()
    .map(face => {
      if (!face.inSet(touchingFaces)) return face.vIndices();
      const touchingFaceIndex = _.findIndex(touchingFaces, f2 =>
        f2.equals(face),
      );
      return replace(
        face.vIndices(),
        face.vIndices().indexOf(vIndex),
        newPolyhedron.vertices.length +
          mod(touchingFaceIndex + 1, touchingFaces.length),
        newPolyhedron.vertices.length + touchingFaceIndex,
      );
    })
    .concat([_.range(newPolyhedron.vertices.length, newVertices.length)]);
  return Polyhedron.of(newVertices, newFaces);
}

function doTruncate(polyhedron, options: TruncateOptions = {}) {
  let newPolyhedron = polyhedron;
  let mockPolyhedron: Polyhedron = polyhedron;
  // TODO (animation) make this more concise
  _.forEach(polyhedron.vertices, (vertex, index: VIndex) => {
    newPolyhedron = truncateVertex(newPolyhedron, polyhedron, index, options);
    mockPolyhedron = truncateVertex(mockPolyhedron, polyhedron, index, {
      ...options,
      mock: true,
    });
  });
  return {
    animationData: {
      start: removeExtraneousVertices(mockPolyhedron),
      endVertices: removeExtraneousVertices(newPolyhedron).vertices,
    },
    result: deduplicateVertices(newPolyhedron),
  };
}

export const truncate: Operation<TruncateOptions> = {
  apply(polyhedron, options) {
    return doTruncate(polyhedron);
  },
};

export const rectify: Operation<> = {
  apply(polyhedron) {
    return doTruncate(polyhedron, { rectify: true });
  },
};
