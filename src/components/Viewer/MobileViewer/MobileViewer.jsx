// @flow
import React from 'react';

import { makeStyles, media } from 'styles';
import { scroll } from 'styles/common';
import { SrOnly } from 'components/common';
import { BackLink, Title, NavMenu, X3dScene, Panels } from '../common';

import OperationsPanel from './OperationsPanel';

function mobile(styles) {
  return {
    [media.mobileLandscape]: styles(45, 45),
    [media.mobilePortrait]: styles(60, 75),
  };
}
const styles = makeStyles({
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
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
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

export default class MobileViewer extends React.Component<Props> {
  header: *;

  constructor(props: Props) {
    super(props);
    this.header = React.createRef();
  }

  render() {
    const { panel, solid } = this.props;
    const panelNode = (
      <Panels
        panel={panel}
        operationsPanel={() => <OperationsPanel solid={solid} />}
      />
    );
    return (
      <section className={styles('viewer')}>
        <div className={styles('title')}>
          <BackLink solid={solid} />
          <Title name={solid} />
        </div>
        {panelNode && (
          <div
            className={styles(
              'content',
              panel === 'operations' ? 'operations' : 'contentFull',
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
        <main className={styles('scene')}>
          <X3dScene label={solid} />
        </main>
        <div className={styles('menu')}>
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
