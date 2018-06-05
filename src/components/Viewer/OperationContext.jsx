// @flow
import _ from 'lodash';
import React, { Component } from 'react';

import type { Point } from 'types';
import { operations } from 'math/operations';

import { applyOptionsFor } from 'polyhedra/operations';

import connect from 'components/connect';
import { WithPolyhedron } from './PolyhedronContext';

// TODO can we not repeat all this?
const OperationContext = React.createContext({
  operation: undefined,
  opName: '',
  options: undefined,
  hitOptions: undefined, // options determined by the polyhedron face
  setOption: _.noop,
  setHitOptions: _.noop,
  unsetHitOptions: _.noop,
  setOperation: _.noop,
  unsetOperation: _.noop,
});

class BaseOperationProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      operation: undefined,
      opName: '',
      options: {},
      hitOptions: {},
      ..._.pick(this, [
        'setOption',
        'unsetOperation',
        'setOperation',
        'setHitOptions',
        'unsetHitOptions',
      ]),
    };
  }

  render() {
    return (
      <OperationContext.Provider value={this.state}>
        {this.props.children}
      </OperationContext.Provider>
    );
  }

  setOperation = (opName, solid, hitOptions) => {
    this.setState({
      opName,
      operation: operations[opName],
      options: applyOptionsFor(solid, opName),
      hitOptions,
    });
  };

  unsetOperation = () => {
    this.setState({
      opName: '',
      operation: undefined,
      options: undefined,
      hitOptions: undefined,
    });
  };

  setOption = (name: string, value: *) => {
    this.setState(({ options }) => ({
      options: { ...options, [name]: value },
    }));
  };

  unsetHitOptions = () => {
    this.setState(
      ({ hitOptions }) => (hitOptions ? { hitOptions: undefined } : undefined),
    );
  };

  setHitOptions = (hitPnt: Point) => {
    this.setState(
      ({ operation, options, hitOptions }, { polyhedron, isTransitioning }) => {
        if (!operation || isTransitioning) return;
        const newHitOptions = operation.getApplyArgs(
          polyhedron,
          hitPnt,
          options,
        );
        if (!_.isEqual(hitOptions, newHitOptions)) {
          return {
            hitOptions: newHitOptions,
          };
        }
      },
    );
  };
}

export const OperationProvider = connect(
  WithPolyhedron,
  ['polyhedron', 'isTransitioning'],
)(BaseOperationProvider);

export const WithOperation = OperationContext.Consumer;
