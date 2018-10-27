// @flow strict
import _ from 'lodash';
// $FlowFixMe
import { useContext } from 'react';

import { operations } from 'math/operations';
import PolyhedronContext from './PolyhedronContext';
import OperationContext from './OperationContext';

export default function useApplyOperation() {
  const { opName, options, setOperation, unsetOperation } = useContext(
    OperationContext,
  );
  const { polyhedron, setName, transitionPolyhedron } = useContext(
    PolyhedronContext,
  );
  // FIXME this is annoying
  const applyOperation = (
    _opName: string = opName,
    _options: {} = options,
    callback?: *,
  ) => {
    const operation = operations[_opName];

    if (!operation) throw new Error('no operation defined');

    const { result, animationData } = operation.apply(polyhedron, _options);
    if (!operation.hasOptions(result) || _.isEmpty(_options)) {
      unsetOperation();
    } else {
      setOperation(_opName, result);
    }

    transitionPolyhedron(result, animationData);
    setName(result.name);
    if (typeof callback === 'function') {
      callback(result);
    }
  };

  return { applyOperation };
}
