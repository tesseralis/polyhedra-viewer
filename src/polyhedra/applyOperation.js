// @flow
import _ from 'lodash';
import { getNextPolyhedron, getRelations } from './operations';
import { Polyhedron } from 'math/polyhedra';
import { operations } from 'math/operations';
import type { OpName, OperationResult } from 'math/operations';

export default function applyOperation(
  operation: OpName,
  name: string,
  polyhedron: Polyhedron,
  config: any = {},
): OperationResult {
  const relations = getRelations(name, operation);
  const op = operations[operation];
  const options = op.getSearchOptions(polyhedron, config, relations);

  const next = getNextPolyhedron(name, operation, _.pickBy(options));
  if (!op) {
    // throw new Error(`Function not found for ${operation}`)
    return {
      result: Polyhedron.get(next),
      name: next,
      animationData: undefined,
    };
  }
  return { name: next, ...op.apply(polyhedron, config) };
}
