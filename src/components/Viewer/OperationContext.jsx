// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import tinycolor from 'tinycolor2';

import type { Point } from 'types';
import { operations, type OpName } from 'math/operations';
import {
  applyOperation,
  getRelations,
  applyOptionsFor,
} from 'polyhedra/operations';

import { WithPolyhedron } from './PolyhedronContext';

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

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
  options: {},
  hitOptions: {}, // options determined by the polyhedron face
  setOption: _.noop,
  selectOperation: _.noop,
  isEnabled: _.noop,
  setHitOptions: _.noop,
  unsetHitOptions: _.noop,
  applyOperation: _.noop,
  getColors: _.noop,
  unsetOperation: _.noop,
});

class BaseOperationProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      operation: undefined,
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
        'getColors',
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

  selectOperation = (op: OpName) => {
    if (op === this.state.operation) {
      return this.unsetOperation();
    }

    if (!hasOptions(op, getRelations(this.props.solid, op))) {
      this.applyOperation(op);
    } else {
      this.setOperation(op, this.props.solid);
    }
  };

  applyOperation = (
    operation = this.state.operation,
    options = this.state.options,
    hitOptions = this.state.hitOptions,
  ) => {
    const { polyhedron, solid, setSolid, transitionPolyhedron } = this.props;
    // const { operation, options, hitOptions } = this.state;

    if (!operation) throw new Error('no operation defined');

    const allOptions = { ...options, ...hitOptions };

    const { result, name, animationData } = applyOperation(
      operation,
      solid,
      polyhedron,
      allOptions,
    );
    if (!name) throw new Error('Name not found on new polyhedron');
    if (
      _.isEmpty(getRelations(name, operation)) ||
      !hasOptions(operation, getRelations(name, operation)) ||
      _.isEmpty(allOptions)
    ) {
      this.unsetOperation();
    } else {
      this.setOperation(operation, name);
    }

    setSolid(name);
    transitionPolyhedron(result, animationData);
  };

  setOperation = (operation: OpName, solid) => {
    this.setState({
      operation,
      options: applyOptionsFor(solid, operation),
      hitOptions: {},
    });
  };

  unsetOperation = () => {
    this.setState({
      operation: undefined,
      options: {},
      hitOptions: {},
    });
  };

  setOption = (name: string, value: *) => {
    this.setState(({ options }) => ({
      options: { ...options, [name]: value },
    }));
  };

  unsetHitOptions = () => {
    this.setState({ hitOptions: {} });
  };

  setHitOptions = (hitPnt: Point) => {
    this.setState(({ operation, options }, { polyhedron, isTransitioning }) => {
      if (!operation || !operations[operation].getApplyArgs || isTransitioning)
        return;
      return {
        hitOptions: operations[operation].getApplyArgs(
          polyhedron,
          hitPnt,
          options,
        ),
      };
    });
  };

  // TODO put this in a better place
  getColors = () => {
    const { polyhedron } = this.props;
    return polyhedron.faces.map(this.getColorForFace);
  };

  // TODO probably move this and the color utility functions to their own file
  getColorForFace = (face: *) => {
    const { config, polyhedron, faceColors } = this.props;
    const { hitOptions, operation } = this.state;
    const { colors } = config;

    // While doing animation, if we specify that this face has a color, use it
    if (!!faceColors && _.has(faceColors, face.index.toString())) {
      return toRgb(faceColors[face.index]);
    }

    if (
      operation &&
      operations[operation].isHighlighted(polyhedron, hitOptions, face)
    ) {
      return toRgb(
        tinycolor.mix(colors[face.numSides], 'yellow').toHexString(),
      );
    }

    return toRgb(colors[face.numSides]);
  };
}

export function OperationProvider(props: *) {
  return (
    <WithPolyhedron>
      {polyhedronProps => (
        <BaseOperationProvider
          {...props}
          {..._.pick(polyhedronProps, [
            'config',
            'polyhedron',
            'isTransitioning',
            'faceColors',
            'transitionPolyhedron',
          ])}
        />
      )}
    </WithPolyhedron>
  );
}

export const WithOperation = OperationContext.Consumer;
