// @flow strict
import _ from 'lodash';

import type { OpName } from './operationTypes';
import type { Point, Twist } from 'types';
import {
  Polyhedron,
  Vertex,
  Edge,
  normalizeVertex,
  VertexList,
} from 'math/polyhedra';
import { vec, Vec3D, PRECISION, type Transform } from 'math/linAlg';

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

export function getTwistSign(twist: ?Twist) {
  switch (twist) {
    case 'left':
      return 1;
    case 'right':
      return -1;
    default:
      return 0;
  }
}

// Return the indices required to create faces when duplicating vertices
// along an edge
export function getEdgeFacePaths(edge: Edge, twist?: Twist) {
  const [v1, v2] = _.map(edge.vertices, 'index');
  const [f1, f2] = _.map(edge.adjacentFaces(), 'index');
  switch (twist) {
    case 'left':
      return [
        [[f1, v1], [f2, v2], [f1, v2]], // face 1
        [[f1, v1], [f2, v1], [f2, v2]], // face 2
      ];
    case 'right':
      return [
        [[f1, v2], [f1, v1], [f2, v1]], // face 1
        [[f2, v1], [f2, v2], [f1, v2]], // face 2
      ];
    default:
      return [[[f1, v2], [f1, v1], [f2, v1], [f2, v2]]];
  }
}

export function getTransformedVertices<T: VertexList>(
  vLists: T[],
  iteratee: T => Transform | Vec3D,
  vertices?: Vertex[] = vLists[0].polyhedron.vertices,
) {
  // const result = [...vLists[0].polyhedron.vertices];
  const result = [...vertices];
  _.forEach(vLists, vList => {
    _.forEach(vList.vertices, v => {
      const t = iteratee(vList);
      result[v.index] = typeof t === 'function' ? t(v.vec) : t;
    });
  });
  return result;
}

const methodDefaults = {
  getApplyArgs: {},
  getAllApplyArgs: [undefined],
  getSearchOptions: undefined,
  getSelectState: [],
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
  name: string;
  animationData: ?{
    start: Polyhedron,
    endVertices: Point[],
  };
}

type SelectState = 'selected' | 'selectable' | null;

// TODO consolidate these with the one in operationTypes
interface Operation<Options = {}, ApplyArgs = {}> {
  apply(polyhedron: Polyhedron, options: Options): OperationResult;

  getSearchOptions(polyhedron: Polyhedron, options: Options): ?{};

  getApplyArgs(
    polyhedron: Polyhedron,
    hitPnt: Point,
    options: Options,
  ): ApplyArgs;

  getAllApplyArgs(polyhedron: Polyhedron): ApplyArgs[];

  getSelectState(
    polyhedron: Polyhedron,
    options: Options & ApplyArgs,
  ): SelectState[];
}

export function normalizeOperation(op: *, name: OpName): Operation<*, *> {
  const withDefaults = fillDefaults(
    typeof op === 'function' ? { apply: op } : op,
  );
  return {
    ...withDefaults,
    name,
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
    getApplyArgs(polyhedron, hitPnt, options) {
      return withDefaults.getApplyArgs(polyhedron, vec(hitPnt), options);
    },
  };
}
