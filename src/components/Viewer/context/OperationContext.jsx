// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useState, useEffect } from 'react';

import { mapObject } from 'utils';
import { type Operation } from 'math/operations';
import { Polyhedron } from 'math/polyhedra';

const defaultState = {
  operation: null,
  options: null,
};

const actions = ['setOption', 'unsetOperation', 'setOperation'];

const OperationContext = React.createContext({
  ...defaultState,
  ...mapObject(actions, a => [a, _.noop]),
});

export default OperationContext;

export function OperationProvider({ disabled, children }: *) {
  const [operation, _setOperation] = useState(null);
  const [options, setOptions] = useState(null);

  const setOperation = (operation: Operation, solid: Polyhedron) => {
    _setOperation(operation);
    setOptions(operation.defaultOptions(solid));
  };

  const unsetOperation = () => {
    _setOperation(null);
    setOptions(null);
  };

  const setOption = (name: string, value: *) => {
    setOptions({ ...options, [name]: value });
  };

  useEffect(
    () => {
      if (disabled) {
        unsetOperation();
      }
    },
    [disabled],
  );

  const value = {
    operation,
    options,
    setOperation,
    unsetOperation,
    setOption,
  };
  return (
    <OperationContext.Provider value={value}>
      {children}
    </OperationContext.Provider>
  );
}
