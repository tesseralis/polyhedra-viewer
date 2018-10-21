// @flow strict
import _ from 'lodash';
import React, { Component } from 'react';

import { mapObject } from 'utils';
import { operations, type OpName } from 'math/operations';
import { Polyhedron } from 'math/polyhedra';

const defaultState = {
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

  componentDidUpdate(prevProps: *) {
    const { disabled } = this.props;
    if (disabled && !prevProps.disabled) {
      this.unsetOperation();
    }
  }

  render() {
    const value = {
      ...this.state,
      operation: operations[this.state.opName],
    };
    return (
      <OperationContext.Provider value={value}>
        {this.props.children}
      </OperationContext.Provider>
    );
  }

  setOperation = (opName: OpName, solid: Polyhedron) => {
    this.setState({
      opName,
      // TODO should we just store the operation instead?
      options: operations[opName].defaultOptions(solid),
    });
  };

  unsetOperation = () => {
    this.setState({
      opName: '',
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
