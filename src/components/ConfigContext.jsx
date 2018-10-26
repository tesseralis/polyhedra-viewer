// @flow strict
import _ from 'lodash';
import { defaultConfig } from './configOptions';

// $FlowFixMe
import React, { useState, useMemo } from 'react';

const ConfigContext = React.createContext({
  config: defaultConfig,
  setValue: _.noop,
  reset: _.noop,
});

export default ConfigContext;

// TODO now we can split out setValue and reset!
export function ConfigProvider({ children }: *) {
  const [config, setConfig] = useState(defaultConfig);

  const setValue = (key, value) => {
    setConfig(_.set(_.cloneDeep(config), key, value));
  };

  const reset = () => setConfig(defaultConfig);

  const state = useMemo(() => ({ config, setValue, reset }), [config]);

  return (
    <ConfigContext.Provider value={state}>{children}</ConfigContext.Provider>
  );
}

export const WithConfig = ConfigContext.Consumer;
