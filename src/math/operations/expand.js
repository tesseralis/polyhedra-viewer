// @flow strict
import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import { scaleAround } from 'math/linAlg';
import { flatMap, repeat } from 'util.js';
import {
  getTwist,
  getSnubAngle,
  getEdgeFacePaths,
  expansionType,
  isExpandedFace,
  getMappedVertices,
  getResizedVertices,
} from './operationUtils';

// Result functions
// ================
// Since there are only a handful of possibilities for these oprations, it's okay to use shortcuts
// like switching on number of faces, to determine properties.

function getExpansionResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'cuboctahedron';
    case 6:
    case 8:
      return 'rhombicuboctahedron';
    case 12:
    case 20:
      return 'rhombicosidodecahedron';
    default:
      throw new Error('Did you try to expand a non-regular solid?');
  }
}

function getSnubResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'icosahedron';
    case 6:
    case 8:
      return 'snub cube';
    case 12:
    case 20:
      return 'snub dodecahedron';
    default:
      throw new Error('Did you try to snub a non-regular solid?');
  }
}

/**
 * Duplicate the vertices, so that each face has its own unique set of vertices,
 * and create a new face for each edge and new vertex set.
 */
function duplicateVertices(polyhedron: Polyhedron, twist?: 'left' | 'right') {
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

function doExpansion(polyhedron: Polyhedron, referenceName) {
  const reference = Polyhedron.get(referenceName);
  const type = expansionType(reference);
  const n = polyhedron.getFace().numSides;
  const angle = type === 'snub' ? getSnubAngle(reference, n) : 0;
  // FIXME reverse this; get the twist from the property
  const duplicated = duplicateVertices(polyhedron, getTwist(angle));

  const referenceFace =
    _.find(reference.faces, face => isExpandedFace(reference, face, n)) ||
    reference.getFace();
  const referenceLength =
    referenceFace.distanceToCenter() /
    reference.edgeLength() *
    polyhedron.edgeLength();

  const expandFaces = _.filter(duplicated.faces, face =>
    isExpandedFace(duplicated, face, n),
  );

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(expandFaces, referenceLength, angle);

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export function dual(polyhedron: Polyhedron) {
  const scale = (() => {
    const f = polyhedron.getFace().distanceToCenter();
    const e = polyhedron.getEdge().distanceToCenter();
    return e * e / (f * f);
  })();
  const duplicated = duplicateVertices(polyhedron);
  const endVertices = getMappedVertices(
    polyhedron.faces.map(face => face.withPolyhedron(duplicated)),
    (v, f) => scaleAround(f.centroid(), polyhedron.centroid(), scale),
  );

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export function expand(polyhedron: Polyhedron) {
  return doExpansion(polyhedron, getExpansionResult(polyhedron));
}

export function snub(polyhedron: Polyhedron) {
  //  TODO figure out how to calculate this without relying on a reference
  return doExpansion(polyhedron, getSnubResult(polyhedron));
}

