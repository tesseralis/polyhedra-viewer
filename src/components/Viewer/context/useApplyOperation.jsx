// @flow strict
import _ from 'lodash';

// $FlowFixMe
import { useCallback } from 'react';
import { type Operation } from 'math/operations';
import { usePathSetter } from './PathSetter';
import PolyhedronCtx from './PolyhedronCtx';
import OperationCtx from './OperationCtx';
import TransitionCtx from './TransitionCtx';

export default function useApplyOperation() {
  const { setOperation, unsetOperation } = OperationCtx.useActions();
  const setName = usePathSetter();
  const polyhedron = PolyhedronCtx.useState();
  const transition = TransitionCtx.useTransition();

  const applyOperation = useCallback(
    (operation: Operation, options: * = {}, callback?: *) => {
      if (!operation) throw new Error('no operation defined');

      const { result, animationData } = operation.apply(polyhedron, options);
      if (!operation.hasOptions(result) || _.isEmpty(options)) {
        unsetOperation();
      } else {
        setOperation(operation, result);
      }

      transition(result, animationData);
      setName(result.name);
      if (typeof callback === 'function') {
        callback(result);
      }
    },
    [polyhedron, setName, transition],
  );

  return applyOperation;
}
