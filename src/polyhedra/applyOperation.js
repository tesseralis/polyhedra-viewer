// @flow
import _ from 'lodash';
import { getOperationName, getNextPolyhedron, getRelations } from './relations';
import Polyhedron from 'math/Polyhedron';
import Vertex from 'math/solidTypes';
import Peak from 'math/Peak';
import { operations } from 'math/operations';

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
  const op = operations[operationName];
  // FIXME don't have to rely on this
  options = _.invoke(op, 'getSearchOptions', polyhedron, config, relations);
  applyConfig = {
    ...applyConfig,
    ..._.invoke(op, 'getDefaultArgs', polyhedron, config),
  };

  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options));
  if (!_.isFunction(op.apply)) {
    // throw new Error(`Function not found for ${operation}`)
    return { result: Polyhedron.get(next) };
  }
  return updateName(op.apply(polyhedron, applyConfig), next);
}
