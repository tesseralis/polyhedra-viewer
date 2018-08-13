// @flow
import React, { PureComponent } from 'react';
import { makeStyles } from 'styles';

import Sidebar from './Sidebar';
import Overlay from './Overlay';
import { X3dScene } from '../common';

const styles = makeStyles({
  viewer: {
    // We have to use flex here because x3dom doesn't work well with grid
    display: 'flex',
    position: 'fixed',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  sidebarFull: {
    position: 'relative',
    height: '100%',
    minWidth: 400,
    maxWidth: 400,
  },
  sidebarCompact: {
    position: 'absolute',
    top: 0,
    right: 0,
  },

  scene: {
    position: 'relative',
    width: 'calc(100% - 400px)',
    height: '100%',
    alignSelf: 'start',
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
      <div className={styles('viewer')}>
        <div className={styles('scene', full && 'full')}>
          <X3dScene label={solid} />
          <Overlay solid={solid} panel={panel} />
        </div>
        <div className={styles(full ? 'sidebarCompact' : 'sidebarFull')}>
          <Sidebar panel={panel} solid={solid} compact={full} />
        </div>
      </div>
    );
  }
}
