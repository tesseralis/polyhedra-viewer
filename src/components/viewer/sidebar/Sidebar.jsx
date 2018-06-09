// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import Menu from '../Menu';
import ConfigForm from './ConfigForm';
import OperationsPanel from './OperationsPanel';
import PolyhedronList from './PolyhedronList';
import Scene from 'components/Viewer/Scene';
import MobileTracker from 'components/MobileTracker';

const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  full: {
    boxShadow: 'inset 1px -1px 4px LightGray',
  },
  menu: {
    height: 75,
    padding: '0 10px',
  },
  menuMobile: {
    borderTop: '1px solid LightGray',
  },
  menuFull: {
    borderBottom: '1px solid LightGray',
  },
  content: {
    height: 'calc(100% - 75px)',
    overflowY: 'scroll',
  },
});

interface Props {
  panel: string;
  solid: string;
  compact?: boolean;
}

function renderPanel(panel) {
  switch (panel) {
    case 'operations':
      return <OperationsPanel />;
    case 'options':
      return <ConfigForm />;
    case 'list':
      return <PolyhedronList />;
    case 'full':
      return null;
    default:
      throw new Error('unknown tab');
  }
}

export default function Sidebar({ compact, panel, solid }: Props) {
  return (
    <MobileTracker
      renderMobile={() => (
        <section className={css(styles.sidebar, !compact && styles.full)}>
          <div className={css(styles.content)}>
            <Scene panel={panel} solid={solid} />
            {renderPanel(panel)}
          </div>
          <div className={css(styles.menu, styles.menuMobile)}>
            <Menu solid={solid} />
          </div>
        </section>
      )}
      renderDesktop={() => (
        <section className={css(styles.sidebar, !compact && styles.full)}>
          <div className={css(styles.menu, !compact && styles.menuFull)}>
            <Menu solid={solid} compact={!!compact} />
          </div>
          {!compact && (
            <div className={css(styles.content)}>{renderPanel(panel)}</div>
          )}
        </section>
      )}
    />
  );
}
