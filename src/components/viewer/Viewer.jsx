// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { isValidSolid } from 'data';
import { andaleMono } from 'styles/fonts';
import Polyhedron from 'math/Polyhedron';
import type { Vertex } from 'math/solidTypes';
import { fixed, fullScreen } from 'styles/common';
import { unescapeName } from 'polyhedra/names';
import doApplyOperation from 'polyhedra/applyOperation';
import type { Operation } from 'polyhedra/applyOperation';
import { getRelations, applyOptionsFor } from 'polyhedra/relations';
import { defaultConfig, getPolyhedronConfig } from 'constants/configOptions';
import transition from 'transition.js';

import X3dScene from './X3dScene';
import X3dPolyhedron from './Polyhedron';
import { Sidebar } from './sidebar';
import Title from './Title';

const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gridTemplateAreas: '"sidebar scene"',
  },
  sidebar: {
    height: '100%',
    // FIXME this is really janky and messes with the grid template
    position: 'fixed',
    left: 0,
    gridArea: 'sidebar',
  },
  scene: {
    gridArea: 'scene',
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
});

const operationDescriptions = {
  '+': 'Click on a face to add a pyramid or cupola.',
  '-': 'Click on a set of faces to remove them.',
  g: 'Click on a set of faces to gyrate them.',
};

function viewerStateFromSolidName(name) {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`);
  }
  return {
    polyhedron: Polyhedron.get(name),
    operation: null,
    applyOptions: {},
  };
}

function getFaceColors(polyhedron, colors) {
  return _.pickBy(
    polyhedron.faces.map(
      (face, fIndex) => colors[polyhedron.numUniqueSides(fIndex)],
    ),
  );
}

interface ViewerProps {
  solid: string;
  history: any;
}

interface ViewerState {
  polyhedron: Polyhedron;
  operation: ?Operation;
  applyOptions: any;
  interpolated?: Polyhedron;
  faceColors?: any;
  config: any;
  animationData?: any;
}

interface InterpolatedValues {
  vertices: Vertex[];
  faceColors: any;
}

export default class Viewer extends Component<ViewerProps, ViewerState> {
  transitionId: ?any;

  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      polyhedron: Polyhedron.get(props.solid),
      config: defaultConfig,
      applyOptions: {},
    };
  }

  static getDerivedStateFromProps(
    nextProps: ViewerProps,
    prevState: ViewerState,
  ) {
    const { polyhedron } = prevState;
    const { solid } = nextProps;

    if (solid !== polyhedron.name) {
      // If not the result of an operation, update our solid based on the name we got
      return viewerStateFromSolidName(solid);
    }
    return prevState;
  }

  componentDidUpdate(prevProps: ViewerProps) {
    const { history, solid } = this.props;
    const { polyhedron } = this.state;
    if (polyhedron.name !== solid && solid === prevProps.solid) {
      history.push(`/${polyhedron.name}/related`);
    }
  }

  render() {
    const { solid } = this.props;
    const {
      polyhedron,
      interpolated,
      faceColors,
      operation,
      config,
      applyOptions,
    } = this.state;
    // FIXME resizing (decreasing height) for the x3d scene doesn't work well
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
              applyOptions,
              disabled: !!interpolated,
              ..._.pick(this, [
                'applyOperation',
                'recenter',
                'setOperation',
                'setApplyOpt',
              ]),
            }}
          />
        </div>
        <div className={css(styles.scene)}>
          <X3dScene>
            <X3dPolyhedron
              solidData={interpolated || polyhedron}
              faceColors={faceColors}
              config={getPolyhedronConfig(config)}
              operation={operation}
              applyOperation={this.applyOperation}
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
        </div>
      </div>
    );
  }

  setConfigValue = (key: string, value: any) => {
    if (key === null) {
      this.setState({ config: defaultConfig });
    }
    this.setState(({ config }) => ({ config: { ...config, [key]: value } }));
  };

  setOperation = (operation: Operation) => {
    this.setState(({ polyhedron }) => ({
      operation,
      applyOptions: applyOptionsFor(polyhedron.name, operation),
    }));
  };

  applyOperation = (operation: Operation, args: any) => {
    this.setState(({ polyhedron, applyOptions, config }) => {
      const { result, animationData } = doApplyOperation(
        operation,
        polyhedron,
        {
          ...args,
          ...applyOptions,
        },
      );
      // FIXME gyrate -> twist needs to be unset
      const postOpState = (() => {
        if (_.isEmpty(getRelations(result.name, operation))) {
          return { operation: undefined, applyOptions: {} };
        } else {
          return { applyOptions: applyOptionsFor(result.name, operation) };
        }
      })();
      // FIXME figure out how to deduplicate all this logic
      const { colors } = getPolyhedronConfig(config);
      const colorStart =
        animationData && getFaceColors(animationData.start, colors);
      return {
        polyhedron: result,
        animationData,
        faceColors: colorStart,
        interpolated: animationData && animationData.start,
        ...postOpState,
      };
    }, this.startAnimation);
  };

  startAnimation = () => {
    // start the animation
    const { animationData, interpolated, config } = this.state;
    if (!animationData || !interpolated) return;
    console.log('starting transition');

    const { colors, transitionDuration } = getPolyhedronConfig(config);
    const colorStart = getFaceColors(interpolated, colors);
    const colorEnd = getFaceColors(
      interpolated.withVertices(animationData.endVertices),
      colors,
    );
    this.transitionId = transition(
      {
        duration: transitionDuration,
        ease: 'easePolyOut',
        startValue: {
          vertices: interpolated.vertices,
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
          interpolated: (interpolated || polyhedron).withVertices(vertices),
          faceColors,
        }));
      },
    );
  };

  finishAnimation = () => {
    console.log('finish animation');
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

  setApplyOpt = (name: string, value: any) => {
    this.setState(({ applyOptions }) => ({
      applyOptions: { ...applyOptions, [name]: value },
    }));
  };

  componentWillUnmount() {
    if (this.transitionId) {
      cancelAnimationFrame(this.transitionId.current);
    }
  }
}
