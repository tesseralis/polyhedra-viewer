// @flow
import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import type { VIndex } from 'math/polyhedra';
import {
  getSnubAngle,
  expansionType,
  isExpandedFace,
  getResizedVertices,
} from './operationUtils';
import { Operation } from './operationTypes';

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

function duplicateVertices(polyhedron: Polyhedron, twist?: 'left' | 'right') {
  const newVertexMapping = {};
  const vertexFaces = [];
  let newVertices = polyhedron.vertices;
  _.forEach(polyhedron.vertices, (vertex, vIndex: VIndex) => {
    // For each vertex, pick one adjacent face to be the "head"
    // for every other adjacent face, map it to a duplicated vertex
    const [head, ...tail] = polyhedron.directedAdjacentFaces(vIndex);
    const start = newVertices.length;
    _.set(newVertexMapping, [head.fIndex, vIndex], vIndex);
    _.forEach(tail, (face, i) => {
      _.set(newVertexMapping, [face.fIndex, vIndex], start + i);
    });
    vertexFaces.push([vIndex, ..._.range(start, start + tail.length)]);
    newVertices = newVertices.concat(
      _.times(tail.length, () => polyhedron.vertices[vIndex]),
    );
  });

  const remappedOriginalFaces = polyhedron.faces.map((face, fIndex) => {
    return face.map(vIndex => {
      return newVertexMapping[fIndex][vIndex];
    });
  });

  const edgeFaces = (() => {
    return _.flatMap(polyhedron.edges, edge => {
      const [v1, v2] = edge;
      const [f1, f2] = _.map(polyhedron.edgeFaces(edge), 'fIndex');

      switch (twist) {
        case 'right':
          return [
            [
              newVertexMapping[f1][v1],
              newVertexMapping[f2][v2],
              newVertexMapping[f1][v2],
            ],
            [
              newVertexMapping[f1][v1],
              newVertexMapping[f2][v1],
              newVertexMapping[f2][v2],
            ],
          ];
        case 'left':
          return [
            [
              newVertexMapping[f1][v2],
              newVertexMapping[f1][v1],
              newVertexMapping[f2][v1],
            ],
            [
              newVertexMapping[f2][v1],
              newVertexMapping[f2][v2],
              newVertexMapping[f1][v2],
            ],
          ];
        default:
          return [
            [
              newVertexMapping[f1][v2],
              newVertexMapping[f1][v1],
              newVertexMapping[f2][v1],
              newVertexMapping[f2][v2],
            ],
          ];
      }
    });
  })();

  return Polyhedron.of(
    newVertices,
    _.concat(vertexFaces, edgeFaces, remappedOriginalFaces),
  );
}

function getTwist(type, numSides) {
  if (type === 'snub') {
    return numSides === 3 ? 'right' : 'left';
  }
}

function doExpansion(polyhedron: Polyhedron, referenceName) {
  const reference = Polyhedron.get(referenceName);
  const type = expansionType(reference);
  const n = polyhedron.getFace(0).numSides();
  polyhedron = duplicateVertices(polyhedron, getTwist(type, n));

  const referenceFace =
    _.find(reference.getFaces(), face => isExpandedFace(reference, face, n)) ||
    reference.getFace(0);
  const referenceLength =
    referenceFace.distanceToCenter() / reference.edgeLength();

  const snubFaces = _.filter(polyhedron.getFaces(), face =>
    isExpandedFace(polyhedron, face, n),
  );
  const angle = type === 'snub' ? getSnubAngle(reference, n) : 0;

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(
    polyhedron,
    snubFaces,
    referenceLength,
    angle,
  );

  return {
    result: polyhedron.withVertices(endVertices),
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

export const expand: Operation<> = {
  apply(polyhedron: Polyhedron) {
    return doExpansion(polyhedron, getExpansionResult(polyhedron));
  },
};

export const snub: Operation<> = {
  apply(polyhedron: Polyhedron) {
    return doExpansion(polyhedron, getSnubResult(polyhedron));
  },
};
