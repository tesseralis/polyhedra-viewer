// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import * as media from 'styles/media';
import IconLink from 'components/Viewer/IconLink';
import Menu from '../Menu';
import ConfigForm from './ConfigForm';
import OperationsPanel from './OperationsPanel';
import PolyhedronList from './PolyhedronList';
import Scene from 'components/Viewer/Scene';
import MobileTracker from 'components/MobileTracker';

const mobTitleH = 50;
const menuH = 75;
const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'grid',
    gridTemplateRows: `${menuH}px 1fr`,
    gridTemplateAreas: '"menu" "content"',

    [media.mobile]: {
      alignItems: 'end',
      gridTemplateRows: `${mobTitleH}px 1fr ${menuH}px`,
      gridTemplateAreas: '"title" "content" "menu"',
    },
  },
  full: {
    boxShadow: 'inset 1px -1px 4px LightGray',
  },
  menu: {
    gridArea: 'menu',
    height: menuH,
    padding: '0 10px',

    [media.mobile]: {
      borderTop: '1px solid LightGray',
    },
  },
  menuFull: {
    borderBottom: '1px solid LightGray',
  },

  mobileTitle: {
    height: mobTitleH,
    borderBottom: '1px solid LightGray',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    justifyItems: 'center',
  },
  content: {
    overflowY: 'scroll',
    position: 'relative',
  },

  operations: {
    zIndex: 100,
    height: 100,
  },

  contentFull: {
    opacity: 0.75,
    zIndex: 100,
    backgroundColor: 'white',
  },

  scene: {
    zIndex: 0,
    position: 'absolute',
    top: mobTitleH,
    bottom: menuH,
    left: 0,
    right: 0,
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
  const panelNode = renderPanel(panel);
  return (
    <MobileTracker
      renderMobile={() => (
        <section className={css(styles.sidebar, !compact && styles.full)}>
          {/* FIXME title styling, padding... */}
          <div className={css(styles.mobileTitle)}>
            <IconLink iconOnly iconName="periodic-table" title="Table" to="/" />
            {solid}
          </div>
          {panelNode && (
            <div
              className={css(
                styles.content,
                panel === 'operations' ? styles.operations : styles.contentFull,
              )}
            >
              {panelNode}
            </div>
          )}
          <div className={css(styles.scene)}>
            <Scene panel={panel} solid={solid} />
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
