// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import Menu from '../Menu';
import ConfigForm from './ConfigForm';
import OperationsPanel from './OperationsPanel';
import PolyhedronList from './PolyhedronList';

const styles = StyleSheet.create({
  sidebar: {
    width: 400,
    height: '100%',
    position: 'relative',
    boxShadow: 'inset -1px -1px 4px LightGray',
  },
  menu: {
    height: 75,
    padding: '0 10px',
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
}

function renderPanel(panel) {
  switch (panel) {
    case 'operations':
      return <OperationsPanel />;
    case 'options':
      return <ConfigForm />;
    case 'list':
      return <PolyhedronList />;
    default:
      throw new Error('unknown tab');
  }
}

export default function Sidebar({ panel, solid }: Props) {
  return (
    <section className={css(styles.sidebar)}>
      <div className={css(styles.menu)}>
        <Menu solid={solid} />
      </div>
      <div className={css(styles.content)}>{renderPanel(panel)}</div>
    </section>
  );
}
