import _ from 'lodash';
import { getNextPolyhedron, getRelations } from './relations';
import { Polyhedron } from 'math/polyhedra';
import { operations } from 'math/operations';
import type { OperationResult } from 'math/operations';

const updateName = (opResult, name) => {
  if (!opResult.animationData) {
    return { result: opResult, name };
  }
  return { name, ...opResult };
};

export type Operation = 't' | 'a' | 'k' | 'c' | 'e' | '+' | '-' | 'g';

export default function applyOperation(
  operation: Operation,
  name: string,
  polyhedron: Polyhedron,
  config: any = {},
): OperationResult {
  const relations = getRelations(name, operation);
  const op = operations[operation];
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
    return { result: Polyhedron.get(next), name: next };
  }
  return updateName(op.apply(polyhedron, applyConfig), next);
}
