// @flow strict
import _ from 'lodash';
import { createModel } from 'components/common';
import { defaultConfig } from './configOptions';

export default createModel(
  {
    // $FlowFixMe _.set typing is broken
    setValue: (key, value) => state => _.set(_.cloneDeep(state), key, value),
    reset: () => () => defaultConfig,
  },
  defaultConfig,
);
