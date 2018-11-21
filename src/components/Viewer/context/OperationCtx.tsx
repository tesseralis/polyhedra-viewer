import { Operation, Options } from 'math/operations';
import { createHookedContext } from 'components/common';

const defaultState = {
  operation: undefined,
  options: undefined,
};

interface State {
  operation?: Operation;
  options?: Options;
}

type Actions = 'setOperation' | 'unsetOperation' | 'setOption';

export default createHookedContext<State, Actions>(
  {
    setOperation: (operation, solid) => () => {
      return { operation, options: operation.defaultOptions(solid) };
    },
    unsetOperation: () => () => defaultState,
    setOption: (name, value) => ({ operation, options }) => {
      return { operation, options: { ...options, [name]: value } };
    },
  },
  defaultState,
);
