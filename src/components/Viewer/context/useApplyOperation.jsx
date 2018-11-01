// @flow strict
import _ from 'lodash';
// $FlowFixMe
import { useContext } from 'react';

import { type Operation } from 'math/operations';
import PathSetter from './PathSetter';
import PolyhedronModel from './PolyhedronModel';
import OperationModel from './OperationModel';
import TransitionModel from './TransitionModel';

export default function useApplyOperation() {
  const { setOperation, unsetOperation } = OperationModel.useActions();
  const setName = useContext(PathSetter);
  const polyhedron = PolyhedronModel.useState();
  const transitionPolyhedron = TransitionModel.useTransition();

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
