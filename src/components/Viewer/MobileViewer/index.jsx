// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import * as media from 'styles/media';
import { scroll } from 'styles/common';
import {
  IconLink,
  Title,
  NavMenu,
  ConfigForm,
  PolyhedronList,
  X3dScene,
} from '../common';

import OperationsPanel from './OperationsPanel';

function mobile(styles) {
  return {
    [media.mobileLandscape]: styles(45, 45),
    [media.mobilePortrait]: styles(60, 75),
  };
}
const styles = StyleSheet.create({
  viewer: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    display: 'grid',
    gridTemplateAreas: '"title" "content" "menu"',
    ...mobile((mobTitleH, menuH) => ({
      gridTemplateRows: `${mobTitleH}px 1fr ${menuH}px`,
    })),
  },
  menu: {
    ...mobile((mobTitleH, menuH) => ({
      height: menuH,
    })),
    gridArea: 'menu',
    padding: '5px 10px',

    borderTop: '1px solid LightGray',
  },

  title: {
    ...mobile((mobTitleH, menuH) => ({
      height: mobTitleH,
    })),
    padding: '0 10px',
    borderBottom: '1px solid LightGray',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    justifyItems: 'center',
  },
  content: {
    ...scroll('y'),
    gridArea: 'content',
    position: 'relative',
    zIndex: 100,
  },

  operations: {
    pointerEvents: 'none',
  },

  contentFull: {
    opacity: 0.75,
    backgroundColor: 'white',
  },

  scene: {
    ...mobile((mobTitleH, menuH) => ({
      height: `calc(100vh - ${menuH}px - ${mobTitleH}px)`,
    })),
    zIndex: 0,
    gridArea: 'content',
    position: 'relative',
  },
  wut: {
    display: 'block',
    height: '100%',
  },
  options: {
    zIndex: 1,
    alignSelf: 'start',
    pointerEvents: 'none',
    gridArea: 'content',
  },
});

interface Props {
  panel: string;
  solid: string;
}

// TODO dedupe with other sidebar
function renderPanel(panel, solid) {
  switch (panel) {
    case 'operations':
      return <OperationsPanel solid={solid} />;
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
  const panelNode = renderPanel(panel, solid);
  return (
    <section className={css(styles.viewer)}>
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
        <div className={css(styles.wut)}>
          <X3dScene />
        </div>
      </main>
      <div className={css(styles.menu)}>
        <NavMenu solid={solid} />
      </div>
    </section>
  );
}
