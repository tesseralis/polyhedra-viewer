// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { media } from 'styles';
import { scroll } from 'styles/common';
import { SrOnly } from 'components/common';
import {
  BackLink,
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

export default class MobileViewer extends React.Component<Props> {
  header: *;

  constructor(props: Props) {
    super(props);
    this.header = React.createRef();
  }

  render() {
    const { panel, solid } = this.props;
    const panelNode = renderPanel(panel, solid);
    return (
      <section className={css(styles.viewer)}>
        <div className={css(styles.title)}>
          <BackLink solid={solid} />
          <Title name={solid} />
        </div>
        {panelNode && (
          <div
            className={css(
              styles.content,
              panel === 'operations' ? styles.operations : styles.contentFull,
            )}
          >
            <SrOnly>
              <h2 tabIndex={0} ref={this.header}>
                {panel}
              </h2>
            </SrOnly>
            {panelNode}
          </div>
        )}
        <main className={css(styles.scene)}>
          <X3dScene />
        </main>
        <div className={css(styles.menu)}>
          <NavMenu solid={solid} onClick={this.focusOnHeader} />
        </div>
      </section>
    );
  }

  // TODO dedupe with desktop
  focusOnHeader = () => {
    if (this.header.current) {
      this.header.current.focus();
    }
  };
}
