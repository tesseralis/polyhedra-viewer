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
    case 'cumulate':
    case 'contract':
    case 'shorten':
      if (relations.length > 1) {
        return true;
      }
      return false;
    default:
      return _.includes(hasMode, operation);
  }
}

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
});

// TODO save config to local state?
class BaseOperationProvider extends Component<*, *> {
  constructor(props: *) {
    super(props);
    this.state = {
      operation: undefined,
      options: {},
      hitOptions: {},
      setOption: this.setOption,
      selectOperation: this.selectOperation,
      isEnabled: this.isEnabled,
      setHitOptions: this.setHitOptions,
      applyOperation: this.applyOperation,
      applyTwistOperation: this.applyTwistOperation,
      unsetHitOptions: this.unsetHitOptions,
      getColors: this.getColors,
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
      return this.setState({ operation: undefined });
    }
    this.setState(
      {
        operation: op,
        options: applyOptionsFor(this.props.solid, op),
      },
      () => {
        if (!hasOptions(op, getRelations(this.props.solid, op))) {
          this.applyOperation();
        }
      },
    );
  };

  // FIXME don't have something like this
  applyTwistOperation = (twist: *) => {
    this.setState(
      ({ hitOptions }) => {
        return { hitOptions: { ...hitOptions, twist } };
      },
      () => {
        this.applyOperation();
      },
    );
  };

  applyOperation = () => {
    const { polyhedron, solid, setSolid, transitionPolyhedron } = this.props;
    const { operation, options, hitOptions } = this.state;
    if (!operation) throw new Error('no operation defined');

    const { result, name, animationData } = applyOperation(
      operation,
      solid,
      polyhedron,
      { ...options, ...hitOptions },
    );
    if (!name) throw new Error('Name not found on new polyhedron');
    const postOpState = (() => {
      if (
        _.isEmpty(getRelations(name, operation)) ||
        !hasOptions(operation, getRelations(this.props.solid, operation))
      ) {
        return { operation: undefined, options: {} };
      } else {
        return { options: applyOptionsFor(name, operation) };
      }
    })();

    setSolid(name);
    transitionPolyhedron(result, animationData);

    this.setState({
      ...postOpState,
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
    this.setState(({ operation }, { polyhedron }) => {
      if (!operation || !operations[operation].getApplyArgs) return;
      return {
        hitOptions: operations[operation].getApplyArgs(polyhedron, hitPnt),
      };
    });
  };

  // FIXME put this in a better place
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
            'faceColors',
            'transitionPolyhedron',
          ])}
        />
      )}
    </WithPolyhedron>
  );
}

export const WithOperation = OperationContext.Consumer;
