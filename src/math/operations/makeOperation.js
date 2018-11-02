// @flow strict
import _ from 'lodash';

import { toConwayNotation } from 'math/polyhedra/names';
import operationGraph from './operationGraph';
import { getSingle } from 'utils';
import { fromConwayNotation } from 'math/polyhedra/names';
import { vec, PRECISION } from 'math/geom';
import { Polyhedron, normalizeVertex } from 'math/polyhedra';
import { removeExtraneousVertices } from './operationUtils';
import type { Point } from 'types';

type SelectState = 'selected' | 'selectable' | null;

interface OperationResult {
  result: Polyhedron;
  name: string;
  animationData: ?{
    start: Polyhedron,
    endVertices: Point[],
  };
}

const methodDefaults = {
  getHitOption: {},
  allOptionCombos: [null],
  resultsFilter: undefined,
  faceSelectionStates: [],
  defaultOptions: {},
};

export function getOpResults(solid: Polyhedron, opName: string) {
  return operationGraph[toConwayNotation(solid.name)][opName];
}

function fillDefaults(op) {
  return {
    ..._.mapValues(
      methodDefaults,
      (fnDefault, fn) => op[fn] || _.constant(fnDefault),
    ),
    ...op,
  };
}
// Get the polyhedron name as a result of applying the operation to the given polyhedron
function getNextPolyhedron<O>(solid, operation: string, filterOpts: O) {
  const results = getOpResults(solid, operation);
  const next = _(results)
    .filter(!_.isEmpty(filterOpts) ? filterOpts : _.stubTrue)
    .value();
  return fromConwayNotation(getSingle(next).value);
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

// Remove vertices (and faces) from the polyhedron when they are all the same
export function deduplicateVertices(polyhedron: Polyhedron) {
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

type Options = { [string]: mixed };

export interface Operation {
  name: string;
  apply(polyhedron: Polyhedron, options: Options): OperationResult;

  hitOption?: string;

  optionTypes: string[];

  // this is only defined in the stuff we pull into this,
  // but Flow is terrible
  resultsFilter(polyhedron: Polyhedron, options: Options): ?{};

  getHitOption(
    polyhedron: Polyhedron,
    hitPnt: Point,
    options: Options,
  ): Options;

  /**
   * @return all the options for the given option name.
   */
  allOptions(polyhedron: Polyhedron, optionName: string): mixed[];

  /**
   * Test utility.
   * @return all possible option permutations for applying this operation to the given polyhedron.
   */
  allOptionCombos(polyhedron: Polyhedron): Options[];

  /**
   * Given an application of an operation to a given polyhedron with the given options,
   * @return an array mapping face indices to selection states (selectable, selected, or none).
   */
  faceSelectionStates(polyhedron: Polyhedron, options: Options): SelectState[];

  /**
   * @return whether this operation has results for the given polyhedron.
   */
  hasOptions(polyhedron: Polyhedron): boolean;

  /**
   * Return the default selected apply options when an operation is
   * selected on a polyhedron.
   */
  defaultOptions(polyhedron: Polyhedron): Options;
}

export default function makeOperation(name: string, op: *): Operation {
  const withDefaults = fillDefaults(
    typeof op === 'function' ? { apply: op } : op,
  );
  return {
    ...withDefaults,
    name,
    apply(polyhedron, options = {}) {
      // get the next polyhedron name
      const results = getOpResults(polyhedron, name);
      const searchOptions = withDefaults.resultsFilter(
        polyhedron,
        options,
        results,
      );
      const next = getNextPolyhedron(polyhedron, name, _.pickBy(searchOptions));

      // Get the actual operation result
      const opResult = withDefaults.apply(polyhedron, options, next);
      return normalizeOpResult(opResult, next);
    },
    getHitOption(polyhedron, hitPnt, options) {
      return withDefaults.getHitOption(polyhedron, vec(hitPnt), options);
    },
    canApplyTo(polyhedron) {
      return !!getOpResults(polyhedron, name);
    },
    hasOptions(polyhedron) {
      const relations = getOpResults(polyhedron, name);
      if (_.isEmpty(relations)) return false;
      // TODO maybe split up among operations?
      // but I think that might just grow the code...
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
