// @flow
import _ from 'lodash';

import { find, mod, getCyclic } from 'util.js';
import { getNormal, scaleAround, PRECISION } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';
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
// I couldn't actually figure out the math for this so I reverse engineered it.
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

    remappedFacesGraph[adjFace.fIndex] = adjFace
      .withPolyhedron(newPolyhedron)
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
  const n = face.numSides;
  const theta = Math.PI / n;
  const newTheta = theta / 2;
  return 2 * face.apothem() * Math.tan(newTheta);
}

function getTruncateTransform(polyhedron, duplicated) {
  if (isPlatonic(polyhedron)) {
    return (vertex, vIndex) => vertex;
  }

  // If we're doing a bevel, we need to do some fidgeting to make sure the created
  // faces are all regular
  const family = getFamily(polyhedron);
  const truncateLength = getTruncateLength(polyhedron);
  const oldSideLength = polyhedron.edgeLength();

  const multiplier = getRectifiedMultiplier(family);
  const newSideLength = oldSideLength * multiplier;
  const faceResizeScale = newSideLength / truncateLength;

  const reference = Polyhedron.get(getReference(family));
  const normalizedResizeAmount =
    reference.faceWithNumSides(6).distanceToCenter() / reference.edgeLength() -
    polyhedron.smallestFace().distanceToCenter() / newSideLength;

  return (vertex, vIndex) => {
    const nearestHexagon = find(duplicated.adjacentFaces(vIndex), {
      numSides: 6,
    });
    const scaled = scaleAround(
      vertex,
      nearestHexagon.centroid(),
      faceResizeScale,
    );
    // Our normal (heh) normal function doesn't work on just the hexagon,
    // since it has duplicated vertices
    const verts = _.at(nearestHexagon.vertices, [0, 2, 4]);
    const normal = getNormal(verts);
    const translated = scaled.add(
      normal.scale(normalizedResizeAmount * newSideLength),
    );
    return translated;
  };
}

function doTruncate(polyhedron, options: TruncateOptions = {}) {
  const { rectify } = options;
  const truncateLength = getTruncateLength(polyhedron);
  const oldSideLength = polyhedron.edgeLength();
  const truncateScale = (oldSideLength - truncateLength) / 2 / oldSideLength;
  const duplicated = duplicateVertices(polyhedron);
  const transform = getTruncateTransform(polyhedron, duplicated);

  const truncatedVertices = duplicated.vertexVectors().map((v, vIndex) => {
    const adjacentVertices = duplicated.vertexVectors(
      duplicated.adjacentVertexIndices(vIndex),
    );
    const v1 = find(adjacentVertices, adj => adj.distanceTo(v) > PRECISION);
    const truncated = v.interpolateTo(v1, rectify ? 0.5 : truncateScale);
    return (!!transform ? transform(truncated, vIndex) : truncated).toArray();
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
