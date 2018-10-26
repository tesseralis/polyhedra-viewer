// @flow strict
import _ from 'lodash';
// $FlowFixMe
import React, { useState, useEffect } from 'react';

import { mapObject } from 'utils';
import { operations, type OpName } from 'math/operations';
import { Polyhedron } from 'math/polyhedra';

const defaultState = {
  opName: '',
  options: {},
};

const actions = ['setOption', 'unsetOperation', 'setOperation'];

const OperationContext = React.createContext({
  ...defaultState,
  ...mapObject(actions, a => [a, _.noop]),
});

export default OperationContext;

export function OperationProvider({ disabled, children }: *) {
  const [opName, setOpName] = useState('');
  const [options, setOptions] = useState({});

  const setOperation = (opName: OpName, solid: Polyhedron) => {
    setOpName(opName);
    setOptions(operations[opName].defaultOptions(solid));
  };

  const unsetOperation = () => {
    setOpName('');
    setOptions(undefined);
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
    opName,
    options,
    operation: operations[opName],
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
