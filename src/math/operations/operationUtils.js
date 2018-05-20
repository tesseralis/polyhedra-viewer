// @flow strict
import _ from 'lodash';

import {
  Polyhedron,
  Vertex,
  Face,
  Edge,
  normalizeVertex,
  VertexList,
  type VertexArg,
} from 'math/polyhedra';
import {
  type Point,
  vec,
  PRECISION,
  getPlane,
  rotateAround,
} from 'math/linAlg';
import { type Relation } from './operationTypes';

export const hasMultiple = (relations: ?(Relation[]), property: string) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

// TODO maybe this goes in a math/geom file?
// Get antiprism height of a unit antiprism with n sides
export function antiprismHeight(n: number) {
  const sec = 1 / Math.cos(Math.PI / (2 * n));
  return Math.sqrt(1 - sec * sec / 4);
}

// Remove vertices (and faces) from the polyhedron when they are all the same
function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const unique = [];
  const oldToNew = {};

  _.forEach(polyhedron.vertices, (v, vIndex: number) => {
    const match = _.find(unique, point =>
      v.vec.equalsWithTolerance(point.vec, PRECISION),
    );
    if (match === undefined) {
      unique.push(v);
      oldToNew[vIndex] = vIndex;
    } else {
      oldToNew[vIndex] = match.index;
    }
  });

  if (_.isEmpty(oldToNew)) return polyhedron;

  // replace vertices that are the same
  // TODO create a filterFaces method?
  let newFaces = _(polyhedron.faces)
    .map(face => _.uniq(face.vertices.map(v => oldToNew[v.index])))
    .filter(vIndices => vIndices.length >= 3)
    .value();

  // remove extraneous vertices
  return removeExtraneousVertices(
    polyhedron.withChanges(s => s.withFaces(newFaces)),
  );
}
/**
 * Remove vertices in the polyhedron that aren't connected to any faces,
 * and remap the faces to the smaller indices
 */
export function removeExtraneousVertices(polyhedron: Polyhedron) {
  // Vertex indices to remove
  const vertsInFaces = _.flatMap(polyhedron.faces, 'vertices');
  const toRemove = _.filter(polyhedron.vertices, v => !v.inSet(vertsInFaces));
  const numToRemove = toRemove.length;

  // Map the `numToRemove` last vertices of the polyhedron (that don't overlap)
  // to the first few removed vertices
  const newToOld = _(polyhedron.vertices)
    .takeRight(numToRemove)
    .filter(v => !v.inSet(toRemove))
    .map((v, i) => [v.index, toRemove[i].index])
    .fromPairs()
    .value();
  const oldToNew = _.invert(newToOld);

  const newVertices = _(polyhedron.vertices)
    .map(v => polyhedron.vertices[_.get(oldToNew, v.index, v.index)])
    .dropRight(numToRemove)
    .value();

  return polyhedron.withChanges(solid =>
    solid
      .withVertices(newVertices)
      .mapFaces(face =>
        _.map(face.vertices, v => _.get(newToOld, v.index, v.index)),
      ),
  );
}

export function getTwist(angle: number) {
  if (angle > 0) {
    return 'right';
  } else if (angle < 0) {
    return 'left';
  }
}

// Return the indices required to create faces when duplicating vertices
// along an edge
export function getEdgeFacePaths(edge: Edge, twist?: 'left' | 'right') {
  const [v1, v2] = _.map(edge.vertices, 'index');
  const [f1, f2] = _.map(edge.adjacentFaces(), 'index');
  switch (twist) {
    case 'right':
      return [
        [[f1, v1], [f2, v2], [f1, v2]], // face 1
        [[f1, v1], [f2, v1], [f2, v2]], // face 2
      ];
    case 'left':
      return [
        [[f1, v2], [f1, v1], [f2, v1]], // face 1
        [[f2, v1], [f2, v2], [f1, v2]], // face 2
      ];
    default:
      return [[[f1, v2], [f1, v1], [f2, v1], [f2, v2]]];
  }
}

// FIXME play with using a transform matrix instead of an iteratee
export function getMappedVertices<T: VertexList>(
  vLists: T[],
  iteratee: (v: Vertex, t: T) => VertexArg,
) {
  const result = [...vLists[0].polyhedron.vertices];
  _.forEach(vLists, vList => {
    _.forEach(vList.vertices, v => {
      result[v.index] = iteratee(v, vList);
    });
  });
  return result;
}

export function getResizedVertices(
  faces: Face[],
  resizedLength: number,
  angle: number = 0,
) {
  // Update the vertices with the expanded-out version
  const f0 = faces[0];
  return getMappedVertices(faces, (v, face) => {
    const normal = face.normal();
    const rotated =
      angle === 0 ? v.vec : rotateAround(v.vec, face.normalRay(), angle);
    const scale = resizedLength - f0.distanceToCenter();
    return rotated.add(normal.scale(scale));
  });
}

type ExpansionType = 'cantellate' | 'snub';

export function expansionType(polyhedron: Polyhedron): ExpansionType {
  return _.includes([20, 38, 92], polyhedron.numFaces())
    ? 'snub'
    : 'cantellate';
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
};

export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron);
  if (typeof nSides === 'number' && face.numSides !== nSides) return false;
  if (!face.isValid()) return false;
  return _.every(face.adjacentFaces(), { numSides: edgeShape[type] });
}

export function getSnubAngle(polyhedron: Polyhedron, numSides: number) {
  const face0 =
    _.find(polyhedron.faces, face =>
      isExpandedFace(polyhedron, face, numSides),
    ) || polyhedron.getFace();

  const face0AdjacentFaces = face0.vertexAdjacentFaces();
  const faceCentroid = face0.centroid();
  const faceNormal = face0.normal();
  const snubFaces = _.filter(
    polyhedron.faces,
    face =>
      isExpandedFace(polyhedron, face, numSides) &&
      !face.inSet(face0AdjacentFaces),
  );
  const midpoint = face0.edges[0].midpoint();
  const face1 = _.minBy(snubFaces, face =>
    midpoint.distanceTo(face.centroid()),
  );
  const plane = getPlane([
    faceCentroid,
    face1.centroid(),
    polyhedron.centroid(),
  ]);
  const normMidpoint = midpoint.sub(faceCentroid);
  const projected = plane.getProjectedPoint(midpoint).sub(faceCentroid);
  const angle = normMidpoint.angleBetween(projected, true);
  // Return a positive angle if it's a ccw turn, a negative angle otherwise
  const sign = normMidpoint
    .cross(projected)
    .getNormalized()
    .equalsWithTolerance(faceNormal, PRECISION)
    ? -1
    : 1;
  return angle * sign;
}

const methodDefaults = {
  getApplyArgs: {},
  getAllApplyArgs: [undefined],
  getSearchOptions: undefined,
  isHighlighted: false,
};

function fillDefaults(op) {
  return {
    ..._.mapValues(
      methodDefaults,
      (fnDefault, fn) => op[fn] || _.constant(fnDefault),
    ),
    ...op,
  };
}

export interface OperationResult {
  result: Polyhedron;
  // TODO This is optional because we "fill in" an option result with defaults
  // but then we have to check for something we're sure to have...
  name: string;
  animationData: ?{
    start: Polyhedron,
    endVertices: Point[],
  };
}

// TODO consolidate these with the one in operationTypes
interface Operation<Options = {}, ApplyArgs = {}> {
  apply(polyhedron: Polyhedron, options: Options): OperationResult;

  getSearchOptions(polyhedron: Polyhedron, options: Options): ?{};

  getApplyArgs(polyhedron: Polyhedron, hitPnt: Point): ApplyArgs;

  getAllApplyArgs(polyhedron: Polyhedron): ApplyArgs[];

  isHighlighed(
    polyhedron: Polyhedron,
    applyArgs: ApplyArgs,
    face: Face,
  ): boolean;
}

export function normalizeOperation(op: *): Operation<*, *> {
  const withDefaults = fillDefaults(
    typeof op === 'function' ? { apply: op } : op,
  );
  return {
    ...withDefaults,
    apply(polyhedron, options) {
      const opResult = withDefaults.apply(polyhedron, options);
      if (!opResult.animationData) {
        return { result: deduplicateVertices(opResult) };
      }
      const { result, animationData } = opResult;
      const { start, endVertices } = animationData;
      return {
        result: result || deduplicateVertices(start.withVertices(endVertices)),
        animationData: {
          start,
          endVertices: endVertices.map(normalizeVertex),
        },
      };
    },
    getApplyArgs(polyhedron, hitPnt) {
      return withDefaults.getApplyArgs(polyhedron, vec(hitPnt));
    },
  };
}
