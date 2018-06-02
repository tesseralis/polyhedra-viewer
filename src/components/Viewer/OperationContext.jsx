// @flow
import _ from 'lodash';
import React, { Component } from 'react';

import type { Point } from 'types';
import { operations, type OpName } from 'math/operations';
import {
  applyOperation,
  getRelations,
  applyOptionsFor,
} from 'polyhedra/operations';

import { WithPolyhedron } from './PolyhedronContext';

const hasMode = [
  'snub',
  'contract',
  'shorten',
  'cumulate',
  'augment',
  'diminish',
  'gyrate',
];

// TODO possibly move this as part of the operation definition
function hasOptions(operation, relations) {
  switch (operation) {
    case 'turn':
      return relations.length > 1 || !!_.find(relations, 'chiral');
    case 'snub':
    case 'gyroelongate':
      return !!_.find(relations, 'chiral');
    case 'cumulate':
    case 'contract':
    case 'shorten':
      return relations.length > 1;
    default:
      return _.includes(hasMode, operation);
  }
}

// TODO can we not repeat all this?
const OperationContext = React.createContext({
  operation: undefined,
  opName: '',
  options: undefined,
  hitOptions: undefined, // options determined by the polyhedron face
  setOption: _.noop,
  selectOperation: _.noop,
  isEnabled: _.noop,
  setHitOptions: _.noop,
  unsetHitOptions: _.noop,
  applyOperation: _.noop,
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
        'selectOperation',
        'unsetOperation',
        'isEnabled',
        'setHitOptions',
        'applyOperation',
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

  isEnabled = (op: OpName) => {
    return !!getRelations(this.props.solid, op);
  };

  selectOperation = (opName: OpName) => {
    if (opName === this.state.opName) {
      return this.unsetOperation();
    }

    if (!hasOptions(opName, getRelations(this.props.solid, opName))) {
      this.applyOperation(opName);
    } else {
      this.setOperation(opName, this.props.solid);
    }
  };

  applyOperation = (
    opName = this.state.opName,
    options = this.state.options,
    hitOptions = this.state.hitOptions,
  ) => {
    const { polyhedron, solid, setSolid, transitionPolyhedron } = this.props;
    const operation = operations[opName];

    if (!operation) throw new Error('no operation defined');

    const allOptions = { ...options, ...hitOptions };

    // TODO use the operation name instead
    const { result, name, animationData } = applyOperation(
      operation,
      solid,
      polyhedron,
      allOptions,
    );
    if (!name) throw new Error('Name not found on new polyhedron');
    const newRelations = getRelations(name, opName);
    if (
      _.isEmpty(newRelations) ||
      !hasOptions(opName, newRelations) ||
      _.isEmpty(allOptions)
    ) {
      this.unsetOperation();
    } else {
      // Update the current hit options on gyrate
      // TODO generalize this for more operations
      if (!hitOptions) {
        this.setOperation(opName, name);
      } else {
        const { peak } = hitOptions;
        const newHitOptions = peak
          ? { peak: peak.withPolyhedron(result) }
          : undefined;
        this.setOperation(opName, name, newHitOptions);
      }
    }

    setSolid(name);
    transitionPolyhedron(result, animationData);
  };

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

export function OperationProvider(props: *) {
  return (
    <WithPolyhedron>
      {polyhedronProps => (
        <BaseOperationProvider
          {...props}
          {..._.pick(polyhedronProps, [
            'polyhedron',
            'isTransitioning',
            'transitionPolyhedron',
          ])}
        />
      )}
    </WithPolyhedron>
  );
}

export const WithOperation = OperationContext.Consumer;
