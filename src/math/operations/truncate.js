// @flow
import _ from 'lodash';

import { find } from 'util.js';
import { getNormal, scaleAround, PRECISION } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';
import { getCyclic, mod } from 'math/polyhedra/solidUtils';
import { deduplicateVertices } from './operationUtils';
import type { Operation } from './operationTypes';

interface TruncateOptions {
  rectify?: boolean;
}

function isPlatonic(polyhedron) {
  return polyhedron.faceTypes().length === 1;
}

function getFamily(polyhedron) {
  const faceTypes = polyhedron.faceTypes();
  if (_.includes(faceTypes, 5)) return 'I';
  if (_.includes(faceTypes, 4)) return 'O';
  return 'T';
}

function getReference(type) {
  switch (type) {
    case 'O':
      return 'truncated cuboctahedron';
    case 'I':
      return 'truncated icosidodecahedron';
    default:
      throw new Error('Unidentified polyhedron');
  }
}

// Side ratios gotten when calling our "cumulate" operation on a bevelled polyhedron
function getRectifiedMultiplier(type) {
  switch (type) {
    case 'O':
      return 0.37966751081253297;
    case 'I':
      return 0.4059223426569837;
    default:
      throw new Error('Unidentified polyhedron');
  }
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

function getTruncateLength(polyhedron) {
  const face = polyhedron.smallestFace();
  // const sideLength = face.edgeLength();
  const n = face.numSides();
  const theta = Math.PI / n;
  const newTheta = theta / 2;
  return 2 * face.apothem() * Math.tan(newTheta);
}

function truncateRectified(polyhedron) {
  const family = getFamily(polyhedron);
  const multiplier = getRectifiedMultiplier(family);
  const reference = Polyhedron.get(getReference(family));
  const duplicated = duplicateVertices(polyhedron);
  const truncateLength = getTruncateLength(polyhedron);
  const oldSideLength = polyhedron.edgeLength();
  const truncateScale = (oldSideLength - truncateLength) / 2 / oldSideLength;
  const newSideLength = oldSideLength * multiplier;

  const faceResizeScale = newSideLength / truncateLength;
  const normalizedResizeAmount =
    reference.faceWithNumSides(6).distanceToCenter() / reference.edgeLength() -
    polyhedron.smallestFace().distanceToCenter() / newSideLength;

  const truncatedVertices = duplicated.vertexVectors().map((v, vIndex) => {
    const adjacentVertices = duplicated.vertexVectors(
      duplicated.adjacentVertexIndices(vIndex),
    );
    const v1 = find(adjacentVertices, adj => adj.distanceTo(v) > PRECISION);
    const truncated = v.interpolateTo(v1, truncateScale);
    const nearestHexagon = find(
      duplicated.adjacentFaces(vIndex),
      face => face.numSides() === 6,
    );
    const scaled = scaleAround(
      truncated,
      nearestHexagon.centroid(),
      faceResizeScale,
    );
    const verts = _.at(nearestHexagon.vertices, [0, 2, 4]);
    const normal = getNormal(verts);
    const translated = scaled.add(
      normal.scale(normalizedResizeAmount * newSideLength),
    );
    return translated.toArray();
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

function doTruncate(polyhedron, options: TruncateOptions = {}) {
  if (!isPlatonic(polyhedron)) {
    return truncateRectified(polyhedron);
  }
  const { rectify } = options;
  const truncateLength = getTruncateLength(polyhedron);
  const oldSideLength = polyhedron.edgeLength();
  const truncateScale = (oldSideLength - truncateLength) / 2 / oldSideLength;
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
