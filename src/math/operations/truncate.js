// @flow
import _ from 'lodash';

import { find } from 'util.js';
import { PRECISION } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';
import { getCyclic, mod } from 'math/polyhedra/solidUtils';
import { deduplicateVertices } from './operationUtils';
import type { Operation } from './operationTypes';

interface TruncateOptions {
  rectify?: boolean;
}

function duplicateVertex(newPolyhedron, polyhedron, vIndex) {
  const adjacentFaces = polyhedron.directedAdjacentFaces(vIndex);
  const pivot = _.last(adjacentFaces);
  const numVertices = newPolyhedron.numVertices();

  const remappedFacesGraph = {};
  adjacentFaces.forEach((adjFace, i) => {
    const newVertexIndex = adjFace.equals(pivot) ? vIndex : numVertices + i;
    const next = getCyclic(adjacentFaces, i + 1).equals(pivot)
      ? vIndex
      : numVertices + mod(i + 1, adjacentFaces.length);

    remappedFacesGraph[adjFace.fIndex] = newPolyhedron
      .getFace(adjFace.fIndex)
      .replaceVertex(vIndex, next, newVertexIndex);
  });

  const newFace = [
    ..._.range(numVertices, numVertices + adjacentFaces.length - 1),
    vIndex,
  ];

  return newPolyhedron
    .addVertices(
      _.times(adjacentFaces.length - 1, () => newPolyhedron.vertices[vIndex]),
    )
    .mapFaces(face => remappedFacesGraph[face.fIndex] || face.vIndices())
    .addFaces([newFace]);
}

function duplicateVertices(polyhedron) {
  const { vertices, faces } = polyhedron.vertices.reduce(
    (newPolyhedron, vertex, vIndex) => {
      return duplicateVertex(newPolyhedron, polyhedron, vIndex);
    },
    polyhedron,
  );
  // Create a new one so we recalculate the edges
  return Polyhedron.of(vertices, faces);
}

function getTruncateScale(polyhedron) {
  const face = polyhedron.getFace(0);
  const sideLength = face.edgeLength();
  const n = face.numSides();
  const theta = Math.PI / n;
  const newTheta = theta / 2;
  const newSideLength = 2 * face.apothem() * Math.tan(newTheta);
  return (sideLength - newSideLength) / 2 / sideLength;
}

function doTruncate(polyhedron, options: TruncateOptions = {}) {
  const { rectify } = options;
  const truncateScale = getTruncateScale(polyhedron);
  const duplicated = duplicateVertices(polyhedron);

  const truncatedVertices = duplicated.vertexVectors().map((v, vIndex) => {
    const adjacentVertices = duplicated.vertexVectors(
      duplicated.adjacentVertexIndices(vIndex),
    );
    const v1 = find(adjacentVertices, adj => adj.distanceTo(v) > PRECISION);
    return v.interpolateTo(v1, rectify ? 0.5 : truncateScale).toArray();
  });
  const result = duplicated.withVertices(truncatedVertices);
  return {
    animationData: {
      start: duplicated,
      endVertices: truncatedVertices,
    },
    result: rectify ? deduplicateVertices(result) : result,
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
