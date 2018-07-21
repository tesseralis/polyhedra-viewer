// @flow strict
import _ from 'lodash';

import { find } from 'utils';
import { fromConwayNotation, toConwayNotation } from './names';
import { Polyhedron } from 'math/polyhedra';
import polyhedraGraph from './relationsGraph';
import type { OpName as BaseOpName, OperationResult } from 'math/operations';

export type OpName = BaseOpName | 'twist' | 'turn';

interface Operation {
  name: OpName;
  symbol: string;
  description: string;
}

export const operations: Operation[] = [
  {
    name: 'truncate',
    symbol: 't',
    description: 'Cut and create a new face at each vertex.',
  },
  {
    name: 'rectify',
    symbol: 'a',
    description: 'Cut (truncate) each vertex at the midpoint of each edge.',
  },
  {
    name: 'sharpen',
    symbol: 'k',
    description: 'Opposite of truncation. Append a pyramid at certain faces.',
  },
  {
    name: 'dual',
    symbol: 'd',
    description: 'Replace each face with a vertex.',
  },
  {
    name: 'expand',
    symbol: 'e',
    description: 'Pull out faces, creating new square faces.',
  },
  {
    name: 'snub',
    symbol: 's',
    description: 'Pull out and twist faces, creating new triangular faces.',
  },
  {
    name: 'contract',
    symbol: 'c',
    description: 'Opposite of expand/snub. Shrink faces in, removing faces.',
  },
  {
    name: 'twist',
    symbol: 'p',
    description:
      'Replace each square face with two triangular faces, or vice versa.',
  },
  {
    name: 'elongate',
    symbol: 'P',
    description: 'Extend with a prism.',
  },
  {
    name: 'gyroelongate',
    symbol: 'A',
    description: 'Extend with an antiprism.',
  },
  {
    name: 'shorten',
    symbol: 'h',
    description: 'Remove a prism or antiprism',
  },
  {
    name: 'turn',
    symbol: 'u',
    description: 'rotate a prism to an antiprism or vice versa',
  },
  {
    name: 'augment',
    symbol: '+',
    description: 'Append a pyramid, cupola, or rotunda.',
  },
  {
    name: 'diminish',
    symbol: '-',
    description: 'Remove a pyramid, cupola, or rotunda.',
  },
  {
    name: 'gyrate',
    symbol: 'g',
    description: 'Rotate a cupola or rotunda.',
  },
];

function getOpSymbol(name: OpName) {
  return find(operations, { name }).symbol;
}

function getOpName(symbol: string) {
  return find(operations, { symbol }).name;
}

// Get the operations that can be applied to the given solid
export function getOperations(solid: string) {
  return _.keys(polyhedraGraph[toConwayNotation(solid)]).map(getOpName);
}

export function getOpResults(solid: string, opName: OpName) {
  return polyhedraGraph[toConwayNotation(solid)][getOpSymbol(opName)];
}

const defaultAugmentees = {
  '3': 'Y3',
  '4': 'Y4',
  '5': 'Y5',
  '6': 'U3',
  '8': 'U4',
  '10': 'U5',
};

const augmenteeSides = {
  ..._.invert(defaultAugmentees),
  U2: 4,
  R5: 10,
};

const usingTypeOrder = ['Y', 'U', 'R'];

export function getUsingOpts(solid: string) {
  const augments = getOpResults(solid, 'augment');
  const using = _.uniq(_.map(augments, 'using'));
  const grouped = _.groupBy(using, option => augmenteeSides[option]);
  const opts = _.find(grouped, group => group.length > 1) || [];
  return _.sortBy(opts, using => usingTypeOrder.indexOf(using[0]));
}

// Get the polyhedron name as a result of applying the operation to the given polyhedron
function getNextPolyhedron<O>(solid: string, operation: OpName, filterOpts: O) {
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

function hasMultipleOptionsForFace(relations) {
  return _.some(relations, relation =>
    _.includes(['U2', 'R5'], relation.using),
  );
}

// Return the default options for the given solid and operation
export function applyOptionsFor(solid: string, operation: OpName) {
  if (!solid) return;
  const results = getOpResults(solid, operation);
  const newOpts = {};
  if (operation === 'augment') {
    if (_.filter(results, 'gyrate').length > 1) {
      newOpts.gyrate = 'gyro';
    }
    if (hasMultipleOptionsForFace(results)) {
      newOpts.using = getUsingOpts(solid)[0];
    }
  }
  return newOpts;
}

export function hasOptions(solid: string, operation: OpName) {
  const relations = getOpResults(solid, operation);
  if (_.isEmpty(relations)) return false;
  switch (operation) {
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
}

export function applyOperation(
  operation: *,
  name: string,
  polyhedron: Polyhedron,
  config: * = {},
): OperationResult {
  const results = getOpResults(name, operation.name);
  const options = operation.getSearchOptions(polyhedron, config, results);

  const next = getNextPolyhedron(name, operation.name, _.pickBy(options));
  if (!operation.name) {
    return {
      result: Polyhedron.get(next),
      name: next,
      animationData: undefined,
    };
  }
  return { name: next, ...operation.apply(polyhedron, config) };
}
