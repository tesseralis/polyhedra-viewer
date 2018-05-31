// @flow
import _ from 'lodash';
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import tinycolor from 'tinycolor2';
import { type Point } from 'types';

import { andaleMono } from 'styles/fonts';
import { operations } from 'math/operations';
import type { OpName } from 'math/operations';
import { fixed, fullScreen } from 'styles/common';
import { unescapeName } from 'polyhedra/names';
import {
  applyOperation,
  getRelations,
  applyOptionsFor,
} from 'polyhedra/operations';

import { WithConfig } from 'components/ConfigContext';
import { WithPolyhedron } from './PolyhedronContext';
import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';
import Sidebar from './Sidebar';
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

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb();
  return [r / 255, g / 255, b / 255];
}

interface ViewerProps {
  solid: string;
  history: any;
  config: any;
}

interface ViewerState {
  operation: ?OpName;
  // TODO consolidate applyArgs (which are determined by the polyhedron)
  // and applyOptions (which are determined by the the panel)
  applyOptions: any;
  applyArgs: any;
  opApplied: boolean;
}

class Viewer extends Component<*, ViewerState> {
  constructor(props: ViewerProps) {
    super(props);
    this.state = {
      operation: undefined,
      opApplied: false,
      applyOptions: {},
      applyArgs: {},
    };
  }

  componentDidMount() {
    const { solid, setPolyhedron } = this.props;
    setPolyhedron(solid);
  }

  componentDidUpdate(prevProps) {
    const { solid, setPolyhedron } = this.props;
    const { opApplied } = this.state;

    // // If an operation has not been applied and there is a mismatch betweeen the props and context,
    // // update context
    if (!opApplied && solid !== prevProps.solid) {
      setPolyhedron(solid);
    } else if (opApplied) {
      this.setState({ opApplied: false });
    }
  }

  render() {
    const {
      solid,
      config,
      polyhedron,
      isTransitioning,
      recenter,
      resize,
    } = this.props;
    const { operation, applyOptions } = this.state;
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.sidebar)}>
          <Sidebar
            operationsPanelProps={{
              solid,
              operation,
              recenter,
              resize,
              disabled: !!isTransitioning,
              ..._.pick(this, ['setOperation', 'applyOperation']),
            }}
          />
        </div>
        <div className={css(styles.scene)}>
          <X3dScene>
            <X3dPolyhedron
              solidData={polyhedron.solidData}
              faceColors={this.getColors()}
              config={config}
              onHover={this.setApplyArgs}
              onClick={this.applyCurrentOperation}
              onMouseOut={this.unsetApplyArgs}
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
                disabled={isTransitioning}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  getColors = () => {
    const { polyhedron } = this.props;
    return polyhedron.faces.map(this.getColorForFace);
  };

  // TODO probably move this and the color utility functions to their own file
  getColorForFace = (face: *) => {
    const { config, polyhedron, faceColors } = this.props;
    const { applyArgs, operation } = this.state;
    const { colors } = config;

    // While doing animation, if we specify that this face has a color, use it
    if (!!faceColors && _.has(faceColors, face.index.toString())) {
      return toRgb(faceColors[face.index]);
    }

    if (
      operation &&
      operations[operation].isHighlighted(polyhedron, applyArgs, face)
    ) {
      return toRgb(
        tinycolor.mix(colors[face.numSides], 'yellow').toHexString(),
      );
    }

    return toRgb(colors[face.numSides]);
  };

  setOperation = (operation: OpName) => {
    this.setState(({ operation: currentOp }, { polyhedron, solid }) => {
      if (operation === currentOp) {
        return { operation: undefined, applyOptions: {} };
      }
      return {
        operation,
        applyOptions: applyOptionsFor(solid, operation),
      };
    });
  };

  applyCurrentOperation = () => {
    // TODO possibility of error since we're referencing state before setting it
    const { operation, applyArgs } = this.state;
    const { isTransitioning } = this.props;
    if (operation && !_.isEmpty(applyArgs) && !isTransitioning) {
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
    const { polyhedron, solid, transitionPolyhedron } = this.props;
    const { applyOptions, applyArgs } = this.state;
    const { result, name, animationData } = applyOperation(
      operation,
      solid,
      polyhedron,
      {
        ...applyArgs,
        ...applyOptions,
      },
    );
    if (!name) throw new Error('Name not found on new polyhedron');
    const postOpState = (() => {
      if (_.isEmpty(getRelations(name, operation))) {
        return { operation: undefined, applyOptions: {} };
      } else {
        return { applyOptions: applyOptionsFor(name, operation) };
      }
    })();

    this.props.history.push(`/${name}/related`);
    transitionPolyhedron(result, animationData);

    this.setState({
      applyArgs: {},
      opApplied: true,
      ...postOpState,
    });
  };

  setApplyOpt = (name: string, value: any) => {
    this.setState(({ applyOptions }) => ({
      applyOptions: { ...applyOptions, [name]: value },
    }));
  };

  unsetApplyArgs = () => {
    this.setState({ applyArgs: {} });
  };

  setApplyArgs = (hitPnt: Point) => {
    this.setState(({ operation }, { polyhedron }) => {
      if (!operation || !operations[operation].getApplyArgs) return;
      return {
        applyArgs: operations[operation].getApplyArgs(polyhedron, hitPnt),
      };
    });
  };
}

// FIXME we can probably make it so we don't need config here
// FIXME do we even need provider?
export default (props: ViewerProps) => (
  <WithConfig>
    {({ config }) => (
      <WithPolyhedron>
        {polyhedronProps => (
          <Viewer {...props} {...polyhedronProps} config={config} />
        )}
      </WithPolyhedron>
    )}
  </WithConfig>
);
