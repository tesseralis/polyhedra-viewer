import _ from 'lodash';

import { repeat, find } from 'utils';
import { withOrigin, PRECISION, Vec3D } from 'math/geom';
import { Polyhedron, Vertex } from 'math/polyhedra';
import makeOperation from '../makeOperation';

// Side ratios gotten when calling our "sharpen" operation on a bevelled polyhedron
// I couldn't actually figure out the math for this so I reverse engineered it.
function getRectifiedMultiplier(result: string) {
  switch (result) {
    case 'truncated cuboctahedron':
      return 0.37966751081253297;
    case 'truncated icosidodecahedron':
      return 0.4059223426569837;
    default:
      throw new Error('Unidentified polyhedron');
  }
}

function duplicateVertices(polyhedron: Polyhedron) {
  const mapping: NestedRecord<number, number, number> = {};
  const count = polyhedron.getVertex().adjacentFaces().length;
  _.forEach(polyhedron.vertices, v => {
    _.forEach(v.adjacentFaces(), (face, i) => {
      _.set(mapping, [face.index, v.index], i);
    });
  });

  return polyhedron.withChanges(solid => {
    return solid
      .withVertices(_.flatMap(polyhedron.vertices, v => repeat(v.value, count)))
      .mapFaces(face => {
        return _.flatMap(face.vertices, v => {
          const base = count * v.index;
          const j = mapping[face.index][v.index];
          return [base + ((j + 1) % count), base + j];
        });
      })
      .addFaces(
        _.map(polyhedron.vertices, v =>
          _.range(v.index * count, (v.index + 1) * count),
        ),
      );
  });
}

function getTruncateLength(polyhedron: Polyhedron) {
  const face = polyhedron.smallestFace();
  const n = face.numSides;
  const theta = Math.PI / n;
  const newTheta = theta / 2;
  return 2 * face.apothem() * Math.tan(newTheta);
}

type Transform = (vector: Vec3D, vertex: Vertex) => Vec3D;

function getTruncateTransform(polyhedron: Polyhedron, result = ''): Transform {
  if (polyhedron.isRegular()) {
    return vector => vector;
  }

  // If we're doing a bevel, we need to do some fidgeting to make sure the created
  // faces are all regular
  const truncateLength = getTruncateLength(polyhedron);
  const oldSideLength = polyhedron.edgeLength();

  const multiplier = getRectifiedMultiplier(result);
  const newSideLength = oldSideLength * multiplier;
  const faceResizeScale = newSideLength / truncateLength;

  const reference = Polyhedron.get(result);
  const normalizedResizeAmount =
    reference.faceWithNumSides(6).distanceToCenter() / reference.edgeLength() -
    polyhedron.smallestFace().distanceToCenter() / newSideLength;

  return (vector, vertex) => {
    const smallFace = find(vertex.adjacentFaces(), {
      numSides: 6,
    });
    const normal = smallFace.withPolyhedron(polyhedron).normal();
    const transform = withOrigin(smallFace.centroid(), v =>
      v
        .scale(faceResizeScale)
        .add(normal.scale(normalizedResizeAmount * newSideLength)),
    );
    return transform(vector);
  };
}

function doTruncate(polyhedron: Polyhedron, rectify = false, result?: string) {
  const truncateLength = getTruncateLength(polyhedron);
  const oldSideLength = polyhedron.edgeLength();
  const truncateScale = (oldSideLength - truncateLength) / 2 / oldSideLength;
  const duplicated = duplicateVertices(polyhedron);
  const transform = getTruncateTransform(polyhedron, result);

  const truncatedVertices = duplicated.vertices.map(vertex => {
    const adjacentVertices = vertex.adjacentVertices();
    const v = vertex.vec;
    const v1 = find(adjacentVertices, adj => adj.vec.distanceTo(v) > PRECISION);
    const truncated = v.interpolateTo(v1.vec, rectify ? 0.5 : truncateScale);
    return !!transform ? transform(truncated, vertex) : truncated;
  });
  return {
    animationData: {
      start: duplicated,
      endVertices: truncatedVertices,
    },
  };
}

export const truncate = makeOperation('truncate', {
  apply(polyhedron, $, result) {
    return doTruncate(polyhedron, false, result);
  },
});

export const rectify = makeOperation('rectify', {
  apply(polyhedron) {
    return doTruncate(polyhedron, true);
  },
});
