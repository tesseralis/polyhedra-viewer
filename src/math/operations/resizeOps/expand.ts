import _ from 'lodash';
import { Twist } from 'types';
import { Polyhedron, Face } from 'math/polyhedra';
import { withOrigin } from 'math/geom';
import { repeat } from 'utils';
import {
  getTwistSign,
  getEdgeFacePaths,
  getTransformedVertices,
} from '../operationUtils';
import makeOperation from '../makeOperation';
import {
  getSnubAngle,
  getExpandedFaces,
  isExpandedFace,
  getResizedVertices,
} from './resizeUtils';

/**
 * Duplicate the vertices, so that each face has its own unique set of vertices,
 * and create a new face for each edge and new vertex set.
 */
function duplicateVertices(polyhedron: Polyhedron, twist?: Twist) {
  const count = polyhedron.getVertex().adjacentFaces().length;

  const newVertexMapping: NestedRecord<number, number, number> = {};
  _.forEach(polyhedron.vertices, v => {
    // For each vertex, pick one adjacent face to be the "head"
    // for every other adjacent face, map it to a duplicated vertex
    _.forEach(v.adjacentFaces(), (f, i) => {
      _.set(newVertexMapping, [f.index, v.index], v.index * count + i);
    });
  });

  return polyhedron.withChanges(solid =>
    solid
      .withVertices(_.flatMap(polyhedron.vertices, v => repeat(v.value, count)))
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

/**
 * Duplication function for semi-expanding truncated polyhedra
 */
function duplicateVerticesSemi(polyhedron: Polyhedron) {
  const largeFaceType = polyhedron.largestFace().numSides;
  return polyhedron.withChanges(solid =>
    solid
      .withVertices(_.flatMap(polyhedron.vertices, v => repeat(v.value, 2)))
      // duplicate the vertices of "small" faces
      // update the vertices of "big" ones
      .mapFaces(face => {
        if (face.numSides !== largeFaceType) {
          return _.flatMap(face.vertices, v => [v.index * 2, v.index * 2 + 1]);
        } else {
          return face.edges.map(e => {
            if (e.twinFace().numSides !== largeFaceType) {
              return e.v1.index * 2;
            } else {
              return e.v1.index * 2 + 1;
            }
          });
        }
      })
      // add faces for each edge between "large" faces
      .addFaces(
        polyhedron.edges
          .filter(
            e =>
              e.face.numSides === largeFaceType &&
              e.twinFace().numSides === largeFaceType,
          )
          .map(e => [
            e.v1.index * 2 + 1,
            e.v1.index * 2,
            e.v2.index * 2 + 1,
            e.v2.index * 2,
          ]),
      ),
  );
}

function isTruncated(polyhedron: Polyhedron) {
  return polyhedron.name.includes('truncated');
}

function doSemiExpansion(polyhedron: Polyhedron, referenceName: string) {
  const reference = Polyhedron.get(referenceName);
  const largeFaceType = polyhedron.largestFace().numSides;
  const referenceFace = reference.faceWithNumSides(largeFaceType);
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength();
  const largeFaceIndices = polyhedron.faces
    .filter(face => face.numSides === largeFaceType)
    .map(face => face.index);
  const duplicated = duplicateVerticesSemi(polyhedron);
  const expandFaces = duplicated.faces.filter(face =>
    largeFaceIndices.includes(face.index),
  );
  const endVertices = getResizedVertices(expandFaces, referenceLength);
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

function doExpansion(
  polyhedron: Polyhedron,
  referenceName: string,
  twist?: Twist,
) {
  const reference = Polyhedron.get(referenceName);
  const n = polyhedron.getFace().numSides;
  const duplicated = duplicateVertices(polyhedron, twist);

  // TODO precalculate this
  const referenceFace =
    _.find<Face>(reference.faces, face => isExpandedFace(reference, face, n)) ??
    reference.getFace();
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength();

  const expandFaces = _.filter<Face>(duplicated.faces, face =>
    isExpandedFace(duplicated, face, n),
  );
  const refFaces = getExpandedFaces(reference, n);
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

export const expand = makeOperation('expand', {
  apply(polyhedron, $, result) {
    if (isTruncated(polyhedron)) {
      return doSemiExpansion(polyhedron, result);
    }
    return doExpansion(polyhedron, result);
  },
});

export const snub = makeOperation('snub', {
  apply(polyhedron, { twist = 'left' }, result) {
    return doExpansion(polyhedron, result, twist);
  },
  optionTypes: ['twist'],
  allOptionCombos() {
    return [{ twist: 'left' }, { twist: 'right' }];
  },
});

export const dual = makeOperation('dual', {
  apply(polyhedron) {
    // Scale to create a dual polyhedron with the same midradius
    const scale = (() => {
      const f = polyhedron.getFace().distanceToCenter();
      const e = polyhedron.getEdge().distanceToCenter();
      return (e * e) / (f * f);
    })();
    const duplicated = duplicateVertices(polyhedron);
    const faces = _.take(duplicated.faces, polyhedron.numFaces());
    const endVertices = getTransformedVertices(faces, f =>
      withOrigin(polyhedron.centroid(), v => v.scale(scale))(f.centroid()),
    );

    return {
      animationData: {
        start: duplicated,
        endVertices,
      },
    };
  },
});
