// @flow strict
import _ from 'lodash';
import { defaultConfig } from 'constants/configOptions';

import React, { Component } from 'react';

// TODO where does this go? components/common? A state/reducer folder?
const ConfigContext = React.createContext({
  config: defaultConfig,
  setValue: _.noop,
  reset: _.noop,
});

// TODO save config to local state?
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
    // TODO make different functions
    if (key === null) {
      this.setState({ config: defaultConfig });
    }
    this.setState(({ config }) => ({
      config: _.set(_.cloneDeep(config), key, value),
    }));
  };

  reset = () => {
    this.setState({ config: defaultConfig });
  };
}

export const WithConfig = ConfigContext.Consumer;
