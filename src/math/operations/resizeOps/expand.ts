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
  _.forEach(polyhedron.vertices, (v, vIndex: number) => {
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
    _.find<Face>(reference.faces, face => isExpandedFace(reference, face, n)) ||
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
  },
});
