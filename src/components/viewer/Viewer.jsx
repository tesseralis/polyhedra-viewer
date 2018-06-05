// @flow
import React, { PureComponent } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { type RouterHistory } from 'react-router-dom';

import { fullScreen } from 'styles/common';

import { OperationProvider } from './OperationContext';
import { PolyhedronProvider } from './PolyhedronContext';
import SolidSync from './SolidSync';
import Sidebar from './Sidebar';
import Scene from './Scene';

const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'flex',
    width: '100%',
  },
  sidebar: {
    position: 'relative',
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
  history: RouterHistory;
}

class Viewer extends PureComponent<*> {
  render() {
    const { solid, panel } = this.props;
    return (
      <div className={css(styles.viewer)}>
        <SolidSync solid={solid} panel={panel} />
        {panel !== 'full' && (
          <div className={css(styles.sidebar)}>
            <Sidebar panel={panel} solid={solid} />
          </div>
        )}
        <Scene panel={panel} solid={solid} />
      </div>
    );
  }
}

export default (props: ViewerProps) => (
  <PolyhedronProvider
    name={props.solid}
    setName={name => props.history.push(`/${name}/operations`)}
  >
    <OperationProvider>
      <Viewer {...props} />
    </OperationProvider>
  </PolyhedronProvider>
);
