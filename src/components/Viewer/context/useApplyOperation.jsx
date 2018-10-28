// @flow strict
import _ from 'lodash';
// $FlowFixMe
import { useContext } from 'react';

import { type Operation } from 'math/operations';
import PolyhedronContext from './PolyhedronContext';
import OperationContext from './OperationContext';

export default function useApplyOperation() {
  const { setOperation, unsetOperation } = useContext(OperationContext);
  const { polyhedron, setName, transitionPolyhedron } = useContext(
    PolyhedronContext,
  );

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
