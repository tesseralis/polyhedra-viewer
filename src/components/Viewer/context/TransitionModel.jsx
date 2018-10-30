// @flow strict
// $FlowFixMe
import { createModel } from 'components/common';

const defaultState = {
  transitionData: null,
  faceColors: null,
  isTransitioning: false,
};
export default createModel(
  {
    reset: () => () => defaultState,
    set: (transitionData, faceColors) => () => ({
      transitionData,
      faceColors,
      isTransitioning: !!transitionData,
    }),
  },
  defaultState,
);
