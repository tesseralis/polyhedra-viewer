// @flow strict
import _ from 'lodash';

import { fromConwayNotation, toConwayNotation } from 'math/polyhedra/names';
import operationGraph from './operationGraph';
import type { Point, Twist } from 'types';
import {
  Polyhedron,
  Vertex,
  Edge,
  normalizeVertex,
  VertexList,
} from 'math/polyhedra';
import { vec, Vec3D, PRECISION, type Transform } from 'math/geom';

export function getOperations(solid: string) {
  return _.keys(operationGraph[toConwayNotation(solid)]);
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
  getHitOption: {},
  getAllOptions: [undefined],
  getSearchOptions: undefined,
  getSelectState: [],
  applyOptionsFor: {},
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
interface Operation<Options = {}> {
  apply(polyhedron: Polyhedron, options: Options): OperationResult;

  getSearchOptions(polyhedron: Polyhedron, options: Options): ?{};

  getHitOption(
    polyhedron: Polyhedron,
    hitPnt: Point,
    options: Options,
  ): Options;

  getAllOptions(polyhedron: Polyhedron): Options[];

  getSelectState(polyhedron: Polyhedron, options: Options): SelectState[];

  hasOptions(polyhedron: Polyhedron): boolean;

  applyOptionsFor(polyhedron: Polyhedron): Options;
}

export function getOpResults(solid: Polyhedron, opName: string) {
  return operationGraph[toConwayNotation(solid.name)][opName];
}

// Get the polyhedron name as a result of applying the operation to the given polyhedron
function getNextPolyhedron<O>(solid, operation: string, filterOpts: O) {
  const results = getOpResults(solid, operation);
  const next = _(results)
    .filter(!_.isEmpty(filterOpts) ? filterOpts : _.stubTrue)
    .value();
  if (next.length > 1) {
    throw new Error(
      `Multiple possibilities found for operation ${operation} on ${solid} with options ${JSON.stringify(
        filterOpts,
      )}: ${JSON.stringify(next)}`,
    );
  } else if (next.length === 0) {
    throw new Error(
      `No possibilities found for operation ${operation} on ${solid} with options ${JSON.stringify(
        filterOpts,
      )}. Are you sure you didn't put in too many?`,
    );
  }

  return fromConwayNotation(next[0].value);
}

function normalizeOpResult(opResult, newName) {
  if (!opResult.animationData) {
    return { result: deduplicateVertices(opResult).withName(newName) };
  }
  const { result, animationData } = opResult;
  const { start, endVertices } = animationData;

  const normedResult =
    result || deduplicateVertices(start.withVertices(endVertices));

  return {
    result: normedResult.withName(newName),
    animationData: {
      start,
      endVertices: endVertices.map(normalizeVertex),
    },
  };
}

export function makeOperation(name: string, op: *): Operation<*> {
  const withDefaults = fillDefaults(
    typeof op === 'function' ? { apply: op } : op,
  );
  return {
    ...withDefaults,
    name,
    apply(polyhedron, options = {}) {
      // get the next polyhedron name
      const relations = getOpResults(polyhedron, name);
      const searchOptions = withDefaults.getSearchOptions(
        polyhedron,
        options,
        relations,
      );
      const next = getNextPolyhedron(polyhedron, name, _.pickBy(searchOptions));

      // Get the actual operation result
      const opResult = withDefaults.apply(polyhedron, options, next);
      return normalizeOpResult(opResult, next);
    },
    getHitOption(polyhedron, hitPnt, options) {
      return withDefaults.getHitOption(polyhedron, vec(hitPnt), options);
    },
    resultsFor(polyhedron) {
      return getOpResults(polyhedron, name);
    },
    hasOptions(polyhedron) {
      const relations = getOpResults(polyhedron, name);
      if (_.isEmpty(relations)) return false;
      // TODO should this be split up among operations?
      switch (name) {
        case 'turn':
          return relations.length > 1 || !!_.find(relations, 'chiral');
        case 'twist':
          return relations[0].value[0] === 's';
        case 'snub':
        case 'gyroelongate':
          return !!_.find(relations, 'chiral');
        case 'sharpen':
        case 'contract':
        case 'shorten':
          return relations.length > 1;
        case 'augment':
        case 'diminish':
        case 'gyrate':
          return true;
        default:
          return false;
      }
    },
  };
}
