// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { fullScreen } from 'styles/common';
import IconLink from './IconLink';
import Title from './Title';
import Menu from './Menu';
import ConfigForm from './ConfigForm';
import OperationsPanel from './OperationsPanel';
import PolyhedronList from './PolyhedronList';
import X3dScene from './X3dScene';
import Options from './Options';

const mobTitleH = 60;
const menuH = 75;
const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'grid',
    gridTemplateRows: `${mobTitleH}px 1fr ${menuH}px`,
    gridTemplateAreas: '"title" "content" "menu"',
  },
  menu: {
    gridArea: 'menu',
    height: menuH,
    padding: '5px 10px',

    borderTop: '1px solid LightGray',
  },

  title: {
    padding: '0 10px',
    height: mobTitleH,
    borderBottom: '1px solid LightGray',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    justifyItems: 'center',
  },
  content: {
    gridArea: 'content',
    overflowY: 'scroll',
    position: 'relative',
  },

  operations: {
    zIndex: 100,
    height: 100,
    alignSelf: 'end',
  },

  contentFull: {
    opacity: 0.75,
    zIndex: 100,
    backgroundColor: 'white',
  },

  scene: {
    zIndex: 0,
    gridArea: 'content',
  },
});

interface Props {
  panel: string;
  solid: string;
}

// FIXME dedupe with other sidebar
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

export default function MobileViewer({ panel, solid }: Props) {
  const panelNode = renderPanel(panel);
  return (
    <section className={css(styles.viewer)}>
      {/* FIXME title styling, padding... */}
      <div className={css(styles.title)}>
        <IconLink iconOnly iconName="periodic-table" title="Table" to="/" />
        <Title name={solid} />
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
      <main className={css(styles.scene)}>
        <X3dScene />
        <Options solid={solid} />
      </main>
      <div className={css(styles.menu)}>
        <Menu solid={solid} />
      </div>
    </section>
  );
}
