// @flow
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { fullScreen } from 'styles/common';

import { OperationProvider } from './OperationContext';
// TODO how to prevent needing both of these??
import { PolyhedronProvider, WithPolyhedron } from './PolyhedronContext';
import Sidebar from './Sidebar';
import Scene from './Scene';

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
});

interface ViewerProps {
  solid: string;
  history: any;
}

class Viewer extends Component<*> {
  constructor(props: *) {
    super(props);
    const { solid, setPolyhedron } = props;
    setPolyhedron(solid);
  }

  componentDidUpdate(prevProps) {
    const { solid, setPolyhedron, history } = this.props;

    // If an operation has not been applied and there is a mismatch betweeen the props and context,
    // update context
    // TODO is this janky?
    if (
      solid !== prevProps.solid &&
      !history.location.pathname.endsWith('related')
    ) {
      setPolyhedron(solid);
    }
  }

  render() {
    const { solid } = this.props;
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.sidebar)}>
          <Sidebar />
        </div>
        <div className={css(styles.scene)}>
          <Scene solid={solid} />
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
