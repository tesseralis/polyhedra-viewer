// @flow strict
import _ from 'lodash';
import { defaultConfig } from './configOptions';

import React, { Component } from 'react';

const ConfigContext = React.createContext({
  config: defaultConfig,
  setValue: _.noop,
  reset: _.noop,
});

export class ConfigProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      config: defaultConfig,
      setValue: this.setValue,
      reset: this.reset,
    };
  }
  render() {
    return (
      <ConfigContext.Provider value={this.state}>
        {this.props.children}
      </ConfigContext.Provider>
    );
  }

  setValue = (key: string, value: *) => {
    this.setState(({ config }) => ({
      config: _.set(_.cloneDeep(config), key, value),
    }));
  };

  reset = () => {
    this.setState({ config: defaultConfig });
  };
}

export const WithConfig = ConfigContext.Consumer;
