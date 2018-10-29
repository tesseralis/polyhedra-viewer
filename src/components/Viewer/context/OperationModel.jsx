// @flow strict
import { createModel } from 'components/common';

const defaultState = {
  operation: null,
  options: null,
};

export default createModel(
  {
    setOperation: (operation, solid) => state => {
      return { operation, options: operation.defaultOptions(solid) };
    },
    unsetOperation: () => () => defaultState,
    setOption: (name, value) => ({ operation, options }) => {
      return { operation, options: { ...options, [name]: value } };
    },
  },
  defaultState,
);
