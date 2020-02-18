import { Operation } from 'math/operations';
import { createHookedContext } from 'components/common';

const defaultState = {
  operation: undefined,
  options: undefined,
};

type Options = Record<string, any>;
interface State {
  operation?: Operation<Options>;
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
