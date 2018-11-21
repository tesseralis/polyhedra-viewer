
import _ from 'lodash';
import { createHookedContext } from 'components/common';
import { defaultConfig } from './configOptions';

export default createHookedContext(
  {
    
    setValue: (key, value) => state => _.set(_.cloneDeep(state), key, value),
    reset: () => () => defaultConfig,
  },
  defaultConfig,
);
