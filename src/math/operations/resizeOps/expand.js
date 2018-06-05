// @flow strict
import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import { withOrigin } from 'math/linAlg';
import { flatMap, repeat } from 'util.js';
import type { Twist } from 'types';
import {
  getTwistSign,
  getEdgeFacePaths,
  getTransformedVertices,
} from '../operationUtils';
import {
  getSnubAngle,
  getContractFaces,
  isExpandedFace,
  getResizedVertices,
} from './resizeUtils';
import { Operation } from '../operationTypes';

/**
 * Duplicate the vertices, so that each face has its own unique set of vertices,
 * and create a new face for each edge and new vertex set.
 */
function duplicateVertices(polyhedron, twist) {
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
      // Add a new face for each original vertex
      .addFaces(
        _.map(polyhedron.vertices, v =>
          _.range(v.index * count, (v.index + 1) * count),
        ),
      )
      // Add a new face for each original edge
      .addFaces(
        _.flatMap(polyhedron.edges, edge =>
          _.map(getEdgeFacePaths(edge, twist), face =>
            _.map(face, path => _.get(newVertexMapping, path)),
          ),
        ),
      ),
  );
}

function doExpansion(polyhedron, referenceName, twist) {
  const reference = Polyhedron.get(referenceName);
  const n = polyhedron.getFace().numSides;
  // TODO precalculate this
  const duplicated = duplicateVertices(polyhedron, twist);

  const referenceFace =
    _.find(reference.faces, face => isExpandedFace(reference, face, n)) ||
    reference.getFace();
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength();

  const expandFaces = _.filter(duplicated.faces, face =>
    isExpandedFace(duplicated, face, n),
  );
  const refFaces = getContractFaces(reference, n);
  const angle = twist
    ? getTwistSign(twist) * Math.abs(getSnubAngle(reference, refFaces))
    : 0;

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(expandFaces, referenceLength, angle);

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

const expansionResults = {
  T: 'cuboctahedron',
  O: 'rhombicuboctahedron',
  I: 'rhombicosidodecahedron',
};

export function expand(polyhedron: Polyhedron) {
  return doExpansion(polyhedron, expansionResults[polyhedron.symmetry()]);
}

const snubResults = {
  T: 'icosahedron',
  O: 'snub cube',
  I: 'snub dodecahedron',
};

// TODO test chirality
export const snub: Operation<{ twist: Twist }> = {
  apply(polyhedron, { twist = 'left' }) {
    return doExpansion(polyhedron, snubResults[polyhedron.symmetry()], twist);
  },
  getAllApplyArgs(polyhedron) {
    return [{ twist: 'left' }, { twist: 'right' }];
  },
};

export function dual(polyhedron: Polyhedron) {
  // Scale to create a dual polyhedron with the same midradius
  const scale = (() => {
    const f = polyhedron.getFace().distanceToCenter();
    const e = polyhedron.getEdge().distanceToCenter();
    return (e * e) / (f * f);
  })();
  const duplicated = duplicateVertices(polyhedron);
  const faces = polyhedron.faces.map(face => face.withPolyhedron(duplicated));
  const endVertices = getTransformedVertices(faces, f =>
    withOrigin(polyhedron.centroid(), v => v.scale(scale))(f.centroid()),
  );

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}
