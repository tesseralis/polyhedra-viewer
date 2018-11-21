import _ from 'lodash';
import { createHookedContext } from 'components/common';
import { defaultConfig } from './configOptions';

type Actions = 'setValue' | 'reset';
export default createHookedContext<typeof defaultConfig, Actions>(
  {
    setValue: <T>(key: string, value: T) => state =>
      _.set(_.cloneDeep(state), key, value),
    reset: () => () => defaultConfig,
  },
  defaultConfig,
);
