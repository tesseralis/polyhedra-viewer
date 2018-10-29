// @flow strict
// $FlowFixMe
import React, { useReducer } from 'react';

const defaultState = {
  operation: null,
  options: null,
};

const OperationContext = React.createContext(defaultState);
export default OperationContext;

export const OperationActions = React.createContext({});

export function OperationProvider({ children }: *) {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'setOperation': {
        const { operation, solid } = action;
        return { operation, options: operation.defaultOptions(solid) };
      }
      case 'unsetOperation':
        return defaultState;
      case 'setOption': {
        const { operation, options } = state;
        const { name, value } = action;
        return { operation, options: { ...options, [name]: value } };
      }
      default:
        return state;
    }
  }, defaultState);

  // FIXME extract this out
  const actions = {
    setOperation(operation, solid) {
      dispatch({ type: 'setOperation', operation, solid });
    },
    unsetOperation() {
      dispatch({ type: 'unsetOperation' });
    },
    setOption(name, value) {
      dispatch({ type: 'setOption', name, value });
    },
  };

  return (
    <OperationContext.Provider value={state}>
      <OperationActions.Provider value={actions}>
        {children}
      </OperationActions.Provider>
    </OperationContext.Provider>
  );
}
