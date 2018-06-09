// @flow
import React, { PureComponent } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { fullScreen } from 'styles/common';
import * as media from 'styles/media';

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
    [media.desktop]: {
      position: 'absolute',
      top: 0,
      right: 0,
    },
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

export default class DesktopViewer extends PureComponent<*> {
  render() {
    const { solid, panel } = this.props;
    const full = panel === 'full';
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.scene, full && styles.full)}>
          <Scene panel={panel} solid={solid} />
        </div>
        <div
          className={css(
            styles.sidebar,
            full ? styles.sidebarCompact : styles.sidebarFull,
          )}
        >
          <Sidebar panel={panel} solid={solid} compact={full} />
        </div>
      </div>
    );
  }
}
