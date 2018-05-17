// @flow
import _ from 'lodash';
import { getNextPolyhedron, getRelations } from './operations';
import { Polyhedron } from 'math/polyhedra';
import { operations, deduplicateVertices } from 'math/operations';
import type { OpName, OperationResult } from 'math/operations';

function setDefaults(opResult) {
  if (!opResult.animationData) {
    return { result: opResult };
  }
  const { result, animationData } = opResult;
  const { start, endVertices } = animationData;
  return {
    result: result || deduplicateVertices(start.withVertices(endVertices)),
    animationData: {
      start,
      endVertices: endVertices.map(v => v.toArray()),
    },
  };
}

export default function applyOperation(
  operation: OpName,
  name: string,
  polyhedron: Polyhedron,
  config: any = {},
): OperationResult {
  const relations = getRelations(name, operation);
  const op = _.get(operations, operation);
  const options = _.invoke(
    op,
    'getSearchOptions',
    polyhedron,
    config,
    relations,
  );
  const applyConfig = {
    ...config,
    ..._.invoke(op, 'getDefaultArgs', polyhedron, config),
  };

  const next = getNextPolyhedron(name, operation, _.pickBy(options));
  if (!op) {
    // throw new Error(`Function not found for ${operation}`)
    return {
      result: Polyhedron.get(next),
      name: next,
      animationData: undefined,
    };
  }
  return { name: next, ...setDefaults(op.apply(polyhedron, applyConfig)) };
}
