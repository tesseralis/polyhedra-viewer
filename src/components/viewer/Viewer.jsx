// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { rgb } from 'd3-color';
import { type Point } from 'types';

import { isValidSolid } from 'data';
import { andaleMono } from 'styles/fonts';
import { Polyhedron } from 'math/polyhedra';
import { operations } from 'math/operations';
import type { OpName } from 'math/operations';
import polygons from 'constants/polygons';
import { mapObject } from 'util.js';
import { fixed, fullScreen } from 'styles/common';
import { unescapeName } from 'polyhedra/names';
import {
  applyOperation,
  getRelations,
  applyOptionsFor,
} from 'polyhedra/operations';
import { defaultConfig } from 'constants/configOptions';
import transition from 'transition.js';

import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';
import { Sidebar } from './sidebar';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';
import Title from './Title';

const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'flex',
    width: '100%',
  },
  sidebar: {
    height: '100%',
  },
  scene: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100%',
  },
  title: {
    ...fixed('bottom', 'right'),
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },
  description: {
    ...fixed('top', 'right'),
    padding: 36,
    fontSize: 24,
    fontFamily: andaleMono,
    textAlign: 'right',
  },
  overlayContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});

const operationDescriptions = {
  augment: 'Click on a face to add a pyramid or cupola.',
  diminish: 'Click on a pyramid or cupola to remove it.',
  gyrate: 'Click on a set of faces to gyrate them.',
  cumulate: 'Click on a set of faces to cumulate them.',
  contract: 'Click on a set of faces to contract them.',
};

function viewerStateFromSolidName(name) {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`);
  }
  return {
    polyhedron: Polyhedron.get(name),
    solidName: name,
    operation: null,
    applyOptions: {},
    applyArgs: {},
  };
}

function toRgb(hex: string) {
  const { r, g, b } = rgb(hex);
  return [r / 255, g / 255, b / 255];
}
const colorIndexForFace = mapObject(polygons, (n, i) => [n, i]);
const getColorIndex = face => colorIndexForFace[face.numSides];
const polygonColors = colors => polygons.map(n => toRgb(colors[n]));

function getFaceColors(polyhedron, colors) {
  return _.pickBy(
    mapObject(polyhedron.faces, (face, fIndex) => [
      fIndex,
      colors[face.numUniqueSides()],
    ]),
  );
}

interface ViewerProps {
  solid: string;
  history: any;
}

interface ViewerState {
  polyhedron: Polyhedron;
  solidName: string;
  operation: ?OpName;
  // TODO consolidate applyArgs (which are determined by the polyhedron)
  // and applyOptions (which are determined by the the panel)
  applyOptions: any;
  applyArgs: any;
  opApplied: boolean;
  interpolated?: Polyhedron;
  faceColors?: any;
  config: any;
  animationData?: any;
}

interface InterpolatedValues {
  vertices: Point[];
  faceColors: any;
}

export default class Viewer extends Component<ViewerProps, ViewerState> {
  transitionId: ?any;

  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      polyhedron: Polyhedron.get(props.solid),
      solidName: props.solid,
      config: defaultConfig,
      operation: undefined,
      opApplied: false,
      applyOptions: {},
      applyArgs: {},
    };
  }

  static getDerivedStateFromProps(
    { solid }: ViewerProps,
    { opApplied, solidName }: ViewerState,
  ) {
    // If this wasn't the result of an operation and the solid name prop has changed,
    // update our state to reflect that
    if (!opApplied && solid !== solidName) {
      return viewerStateFromSolidName(solid);
    }
    // Otherwise reset the opApplied flag
    return {
      opApplied: false,
    };
  }

  componentWillUnmount() {
    if (this.transitionId) {
      cancelAnimationFrame(this.transitionId.current);
    }
  }

  render() {
    const { solid } = this.props;
    const {
      polyhedron,
      interpolated,
      operation,
      config,
      applyOptions,
    } = this.state;
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.sidebar)}>
          <Sidebar
            configProps={{
              inputValues: config,
              setInputValue: this.setConfigValue,
            }}
            relatedPolyhedraProps={{
              solid,
              operation,
              disabled: !!interpolated,
              ..._.pick(this, [
                'setOperation',
                'applyOperation',
                'recenter',
                'resize',
              ]),
            }}
          />
        </div>
        <div className={css(styles.scene)}>
          <X3dScene>
            <X3dPolyhedron
              solidData={(interpolated || polyhedron).solidData}
              faceColors={this.getColors()}
              config={config}
              setApplyArgs={this.setApplyArgs}
              applyOperation={this.applyCurrentOperation}
            />
          </X3dScene>
          <div className={css(styles.title)}>
            <Title name={unescapeName(solid)} />
          </div>
          {_.has(operationDescriptions, operation) && (
            <div className={css(styles.description)}>
              {_.get(operationDescriptions, operation)}
            </div>
          )}
          {_.includes(['shorten', 'snub'], operation) && (
            <div className={css(styles.overlayContainer)}>
              <TwistOptions onClick={this.applyTwistOperation} />
            </div>
          )}
          {_.includes(['augment'], operation) && (
            <div className={css(styles.overlayContainer)}>
              <AugmentOptions
                solid={solid}
                options={applyOptions}
                onClickOption={this.setApplyOpt}
                disabled={!!interpolated}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  getColors = () => {
    const { interpolated, polyhedron } = this.state;
    return (interpolated || polyhedron).faces.map(this.getColorForFace);
  };

  // TODO probably move this and the color utility functions to their own file
  getColorForFace = (face: *) => {
    const { applyArgs, polyhedron, operation, config, faceColors } = this.state;
    const { colors } = config;
    const defaultColors = polygonColors(colors);

    // While doing animation, if we specify that this face has a color, use it
    if (!!faceColors && _.has(faceColors, face.index.toString())) {
      return toRgb(faceColors[face.index]);
    }

    if (operation) {
      if (operations[operation].isHighlighted(polyhedron, applyArgs, face)) {
        return [1, 1, 0];
      }
    }

    return defaultColors[getColorIndex(face)];
  };

  setConfigValue = (key: string, value: any) => {
    if (key === null) {
      this.setState({ config: defaultConfig });
    }
    this.setState(({ config }) => ({
      config: _.set({ ...config }, key, value),
    }));
  };

  setOperation = (operation: OpName) => {
    this.setState(({ polyhedron, solidName, operation: currentOp }) => {
      if (operation === currentOp) {
        return { operation: undefined, applyOptions: {} };
      }
      return {
        operation,
        applyOptions: applyOptionsFor(solidName, operation),
      };
    });
  };

  applyCurrentOperation = () => {
    // TODO possibility of error since we're referencing state before setting it
    const { operation, applyArgs, interpolated } = this.state;
    if (operation && !_.isEmpty(applyArgs) && !interpolated) {
      this.applyOperation(operation);
    }
  };

  applyTwistOperation = (twist: *) => {
    this.setState(
      ({ applyArgs }) => {
        return { applyArgs: { ...applyArgs, twist } };
      },
      () => {
        this.applyCurrentOperation();
      },
    );
  };

  applyOperation = (operation: OpName) => {
    this.setState(
      ({ polyhedron, solidName, applyOptions, applyArgs, config }) => {
        const { result, name, animationData } = applyOperation(
          operation,
          solidName,
          polyhedron,
          {
            ...applyArgs,
            ...applyOptions,
          },
        );
        if (!name) throw new Error('Name not found on new polyhedron');
        // FIXME gyrate -> twist needs to be unset
        const postOpState = (() => {
          if (_.isEmpty(getRelations(name, operation))) {
            return { operation: undefined, applyOptions: {} };
          } else {
            return { applyOptions: applyOptionsFor(name, operation) };
          }
        })();
        // TODO figure out how to deduplicate all this logic
        const { colors, enableAnimation } = config;
        const colorStart =
          animationData && getFaceColors(animationData.start, colors);
        return {
          polyhedron: result,
          solidName: name,
          animationData,
          faceColors: colorStart,
          interpolated:
            enableAnimation && animationData ? animationData.start : undefined,
          applyArgs: {},
          opApplied: true,
          ...postOpState,
        };
      },
      () => {
        this.updateHistory();
        this.startAnimation();
      },
    );
  };

  updateHistory() {
    this.props.history.push(`/${this.state.solidName}/related`);
  }

  startAnimation = () => {
    // start the animation
    const { animationData, interpolated, config } = this.state;
    if (!animationData || !interpolated) return;

    const { colors, transitionDuration } = config;
    const colorStart = getFaceColors(interpolated, colors);
    const colorEnd = getFaceColors(
      interpolated.withVertices(animationData.endVertices),
      colors,
    );
    this.transitionId = transition(
      {
        duration: transitionDuration,
        startValue: {
          vertices: interpolated.solidData.vertices,
          faceColors: { ...colorEnd, ...colorStart },
        },
        endValue: {
          vertices: animationData.endVertices,
          faceColors: { ...colorStart, ...colorEnd },
        },
        onFinish: this.finishAnimation,
      },
      ({ vertices, faceColors }: InterpolatedValues) => {
        this.setState(({ interpolated, polyhedron }) => ({
          interpolated: (interpolated || polyhedron).withVertices(
            (vertices: any),
          ),
          faceColors,
        }));
      },
    );
  };

  finishAnimation = () => {
    this.setState({
      animationData: undefined,
      interpolated: undefined,
      faceColors: undefined,
    });
  };

  // TODO animation recenter
  // (I feel like doing this will reveal a lot of ways to clean up the animation code)
  recenter = () => {
    this.setState(({ polyhedron }) => ({
      polyhedron: polyhedron.center(),
    }));
  };

  resize = () => {
    this.setState(({ polyhedron }) => ({
      polyhedron: polyhedron.normalizeToVolume(5),
    }));
  };

  setApplyOpt = (name: string, value: any) => {
    this.setState(({ applyOptions }) => ({
      applyOptions: { ...applyOptions, [name]: value },
    }));
  };

  setApplyArgs = (hitPnt?: Point) => {
    this.setState(({ polyhedron, operation }) => {
      if (!operation || !hitPnt) {
        return { applyArgs: {} };
      }
      if (!operations[operation].getApplyArgs) return;
      return {
        applyArgs: operations[operation].getApplyArgs(polyhedron, hitPnt),
      };
    });
  };

  // Testing hack since we can't access the state from integration tests
  getPolyhedron = () => {
    return this.state.polyhedron;
  };
}
