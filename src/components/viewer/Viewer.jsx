// @flow
import React, { PureComponent } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { type RouterHistory } from 'react-router-dom';

import { fullScreen } from 'styles/common';
import * as media from 'styles/media';

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
    [media.mobile]: {
      minWidth: '100%',
    },
  },
  sidebarFull: {
    position: 'relative',
    height: '100%',
    minWidth: 400,
  },
  sidebarCompact: {
    position: 'absolute',
    top: 0,
    right: 0,
  },

  scene: {
    width: 'calc(100% - 400px)',
    [media.mobile]: {
      display: 'none',
    },
  },
  full: {
    width: '100%',
  },
});

interface ViewerProps {
  solid: string;
  history: RouterHistory;
}

function isMobile() {
  const width = window.innerWidth > 0 ? window.innerWidth : window.screen.width;
  return width <= 480;
}

class Viewer extends PureComponent<*> {
  render() {
    const { solid, panel } = this.props;
    const full = panel === 'full';
    const mobile = isMobile();
    return (
      <div className={css(styles.viewer)}>
        <SolidSync solid={solid} panel={panel} />
        {!mobile && (
          <div className={css(styles.scene, full && styles.full)}>
            <Scene panel={panel} solid={solid} />
          </div>
        )}
        <div
          className={css(
            styles.sidebar,
            !mobile && full ? styles.sidebarCompact : styles.sidebarFull,
          )}
        >
          <Sidebar panel={panel} solid={solid} compact={full} />
        </div>
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
