import _ from 'lodash';
import { getNextPolyhedron, getRelations } from './relations';
import { Polyhedron } from 'math/polyhedra';
import { operations } from 'math/operations';
import type { OperationResult } from 'math/operations';

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

export type Operation = 't' | 'a' | 'k' | 'c' | 'e' | '+' | '-' | 'g';

export default function applyOperation(
  operation: Operation,
  polyhedron: Polyhedron,
  config: any = {},
): OperationResult {
  const relations = getRelations(polyhedron.name, operation);
  const op = operations[operation];
  // FIXME don't have to rely on "invoke"
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

  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options));
  if (!op) {
    // throw new Error(`Function not found for ${operation}`)
    return { result: Polyhedron.get(next) };
  }
  return updateName(op.apply(polyhedron, applyConfig), next);
}
