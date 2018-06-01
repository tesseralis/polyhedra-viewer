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
  opName: '',
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
      this.setOperation(opName, name);
    }

    setSolid(name);
    transitionPolyhedron(result, animationData);
  };

  setOperation = (opName: OpName, solid) => {
    this.setState({
      opName,
      operation: operations[opName],
      options: applyOptionsFor(solid, opName),
      hitOptions: {},
    });
  };

  unsetOperation = () => {
    this.setState({
      opName: '',
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
      if (!operation || !operation.getApplyArgs || isTransitioning) return;
      return {
        hitOptions: operation.getApplyArgs(polyhedron, hitPnt, options),
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

    if (operation && operation.isHighlighted(polyhedron, hitOptions, face)) {
      return toRgb(
        tinycolor.mix(colors[face.numSides], 'lightyellow').toHexString(),
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
