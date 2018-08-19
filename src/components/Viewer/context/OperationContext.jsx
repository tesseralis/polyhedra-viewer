// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';

import { mapObject } from 'utils';
import { operations } from 'math/operations';
import { applyOptionsFor, type OpName } from 'polyhedra/operations';

const defaultState = {
  operation: undefined,
  opName: '',
  options: {},
};

const actions = ['setOption', 'unsetOperation', 'setOperation'];

const OperationContext = React.createContext({
  ...defaultState,
  ...mapObject(actions, a => [a, _.noop]),
});

export class OperationProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      ...defaultState,
      ..._.pick(this, actions),
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
