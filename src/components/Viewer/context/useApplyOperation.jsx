// @flow strict
import _ from 'lodash';

import { type Operation } from 'math/operations';
import { usePathSetter } from './PathSetter';
import PolyhedronCtx from './PolyhedronCtx';
import OperationCtx from './OperationCtx';
import TransitionCtx from './TransitionCtx';

export default function useApplyOperation() {
  const { setOperation, unsetOperation } = OperationCtx.useActions();
  const setName = usePathSetter();
  const polyhedron = PolyhedronCtx.useState();
  const transitionPolyhedron = TransitionCtx.useTransition();

  const applyOperation = (
    operation: Operation,
    options: * = {},
    callback?: *,
  ) => {
    if (!operation) throw new Error('no operation defined');

    const { result, animationData } = operation.apply(polyhedron, options);
    if (!operation.hasOptions(result) || _.isEmpty(options)) {
      unsetOperation();
    } else {
      setOperation(operation, result);
    }

    transitionPolyhedron(result, animationData);
    setName(result.name);
    if (typeof callback === 'function') {
      callback(result);
    }
  };

  return applyOperation;
}
