// @flow
import _ from 'lodash';
import {
  getOperationName,
  getNextPolyhedron,
  getRelations,
  getUsingOpt,
} from './relations';
import Polyhedron from 'math/Polyhedron';
import Vertex from 'math/solidTypes';
import Peak from 'math/Peak';
import { operations, operationFunctions } from 'math/operations';

import {
  getAugmentAlignment,
  getPeakAlignment,
  getCupolaGyrate,
} from 'math/applyOptionUtils';

const hasMultiple = (relations, property) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

// FIXME (animation) this is inelegant
const updateName = (opResult, name) => {
  if (!opResult.animationData) {
    return {
      result: opResult.withName(name),
    };
  }
  const { result, animationData: { start, endVertices } } = opResult;
  return {
    result: result.withName(name),
    animationData: {
      start: start.withName(name),
      endVertices,
    },
  };
};

export type Operation = 't' | 'r' | 'k' | 'c' | 'e' | '+' | '-' | 'g';
interface ApplyConfig {
  polygon?: number;
  faceType?: number;
  fIndex?: number;
  using?: string;
  gyrate?: 'ortho' | 'gyro';
  peak?: Peak;
  direction?: 'forward' | 'back';
  align?: 'meta' | 'para';
}

interface OperationResult {
  result: Polyhedron;
  animationData?: {
    start: Polyhedron,
    endVertices: Vertex[],
  };
}

export default function applyOperation(
  operation: Operation,
  polyhedron: Polyhedron,
  config: ApplyConfig = {},
): OperationResult {
  let options: ApplyConfig = {};
  let applyConfig = config;
  const relations = getRelations(polyhedron.name, operation);
  const operationName = getOperationName(operation);
  if (!!operations[operationName]) {
    const op = operations[operationName];
    // FIXME don't have to rely on this
    options = _.invoke(op, 'getSearchOptions', polyhedron, config, relations);
    applyConfig = {
      ...applyConfig,
      ..._.invoke(op, 'getDefaultArgs', polyhedron, config),
    };
  } else if (operation === '+') {
    const { fIndex } = config;

    if (typeof fIndex !== 'number') {
      throw new Error('Invalid fIndex');
    }
    const n = polyhedron.faces[fIndex].length;

    const using = getUsingOpt(config.using, n);

    const baseConfig = {
      using,
      gyrate: using === 'U2' ? 'gyro' : config.gyrate,
    };
    applyConfig = { ...applyConfig, ...baseConfig };
    options = {
      ...baseConfig,
      align: hasMultiple(relations, 'align')
        ? getAugmentAlignment(polyhedron, fIndex)
        : undefined,
    };
  }

  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options));
  const opFunction = !!operations[operationName]
    ? operations[operationName].apply
    : operationFunctions[getOperationName(operation)];
  if (!_.isFunction(opFunction)) {
    // throw new Error(`Function not found for ${operation}`)
    return { result: Polyhedron.get(next) };
  }
  return updateName(opFunction(polyhedron, applyConfig), next);
}
