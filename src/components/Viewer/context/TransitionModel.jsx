// @flow strict
// $FlowFixMe
import { createModel } from 'components/common';

const defaultState = {
  solidData: null,
  faceColors: null,
  isTransitioning: false,
};
export default createModel(
  {
    reset: () => () => defaultState,
    set: (solidData, faceColors) => () => ({
      solidData,
      faceColors,
      isTransitioning: !!solidData,
    }),
  },
  defaultState,
);
