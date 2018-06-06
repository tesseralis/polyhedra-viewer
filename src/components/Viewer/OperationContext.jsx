// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';

import { operations } from 'math/operations';
import { applyOptionsFor, type OpName } from 'polyhedra/operations';

const OperationContext = React.createContext({
  operation: undefined,
  opName: '',
  options: undefined,
  setOption: _.noop,
  setOperation: _.noop,
  unsetOperation: _.noop,
});

export class OperationProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      operation: undefined,
      opName: '',
      options: {},
      ..._.pick(this, ['setOption', 'unsetOperation', 'setOperation']),
    };
  }

  render() {
    return (
      <OperationContext.Provider value={this.state}>
        {this.props.children}
      </OperationContext.Provider>
    );
  }

  setOperation = (opName: OpName, solid: string) => {
    this.setState({
      opName,
      operation: operations[opName],
      options: applyOptionsFor(solid, opName),
    });
  };

  unsetOperation = () => {
    this.setState({
      opName: '',
      operation: undefined,
      options: undefined,
    });
  };

  setOption = (name: string, value: *) => {
    this.setState(({ options }) => ({
      options: { ...options, [name]: value },
    }));
  };
}

export const WithOperation = OperationContext.Consumer;
