// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import Menu from './Menu';
import ConfigForm from './ConfigForm';
import OperationsPanel from './OperationsPanel';
import PolyhedronList from './PolyhedronList';

const menuH = 75;
const styles = StyleSheet.create({
  sidebar: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'grid',
    gridTemplateRows: `${menuH}px 1fr`,
    gridTemplateAreas: '"menu" "content"',
  },
  full: {
    boxShadow: 'inset 1px -1px 4px LightGray',
  },
  menu: {
    gridArea: 'menu',
    height: menuH,
    padding: '0 10px',
  },
  menuFull: {
    borderBottom: '1px solid LightGray',
  },

  content: {
    gridArea: 'content',
    overflowY: 'scroll',
    position: 'relative',
  },

  contentFull: {
    opacity: 0.75,
    zIndex: 100,
    backgroundColor: 'white',
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
    <section className={css(styles.sidebar, !compact && styles.full)}>
      <div className={css(styles.menu, !compact && styles.menuFull)}>
        <Menu solid={solid} compact={!!compact} />
      </div>
      {!compact && (
        <div className={css(styles.content)}>{renderPanel(panel)}</div>
      )}
    </section>
  );
}
