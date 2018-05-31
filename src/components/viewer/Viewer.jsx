// @flow
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { andaleMono } from 'styles/fonts';
import { fixed, fullScreen } from 'styles/common';
import { unescapeName } from 'polyhedra/names';

import { OperationProvider } from './OperationContext';
import { PolyhedronProvider, WithPolyhedron } from './PolyhedronContext';
import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';
import Sidebar from './Sidebar';
import OptionOverlay from './OptionOverlay';
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

interface ViewerProps {
  solid: string;
  history: any;
}

interface ViewerState {
  opApplied: boolean;
}

class Viewer extends Component<*, ViewerState> {
  constructor(props: *) {
    super(props);
    this.state = {
      operation: undefined,
      opApplied: false,
      applyOptions: {},
      applyArgs: {},
    };
    const { solid, setPolyhedron } = props;
    setPolyhedron(solid);
  }

  componentDidUpdate(prevProps) {
    const { solid, setPolyhedron } = this.props;
    const { opApplied } = this.state;

    // // If an operation has not been applied and there is a mismatch betweeen the props and context,
    // // update context
    if (!opApplied && solid !== prevProps.solid) {
      // FIXME opApplied doesn't work anymore
      setPolyhedron(solid);
    } else if (opApplied) {
      this.setState({ opApplied: false });
    }
  }

  render() {
    const { solid, isTransitioning, recenter, resize } = this.props;
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.sidebar)}>
          <Sidebar
            operationsPanelProps={{
              recenter,
              resize,
              disabled: isTransitioning,
            }}
          />
        </div>
        <div className={css(styles.scene)}>
          <X3dScene>
            <X3dPolyhedron />
          </X3dScene>
          <div className={css(styles.title)}>
            <Title name={unescapeName(solid)} />
          </div>
          <OptionOverlay solid={solid} disabled={isTransitioning} />
        </div>
      </div>
    );
  }
}

export default (props: ViewerProps) => (
  <PolyhedronProvider>
    <OperationProvider
      solid={props.solid}
      setSolid={name => props.history.push(`/${name}/related`)}
    >
      <WithPolyhedron>
        {({ setPolyhedron }) => (
          <Viewer {...props} setPolyhedron={setPolyhedron} />
        )}
      </WithPolyhedron>
    </OperationProvider>
    )}
  </PolyhedronProvider>
);
