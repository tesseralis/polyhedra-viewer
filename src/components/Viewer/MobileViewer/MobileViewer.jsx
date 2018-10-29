// @flow
import React from 'react';
import _ from 'lodash';

import memo from 'memo';
import { makeStyles, media } from 'styles';
import { scroll } from 'styles/common';
import { useFocuser, SrOnly } from 'components/common';
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

  transparent: {
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

export default memo(function MobileViewer({ panel, solid }: Props) {
  const [header, focusOnHeader] = useFocuser();
  const isTransparent = _.includes(['operations', 'full'], panel);

  return (
    <section className={styles('viewer')}>
      <div className={styles('title')}>
        <BackLink solid={solid} />
        <Title name={solid} />
      </div>
      <div
        className={styles(
          'content',
          isTransparent ? 'transparent' : 'contentFull',
        )}
      >
        <SrOnly>
          <h2 tabIndex={0} ref={header}>
            {panel}
          </h2>
        </SrOnly>
        <Panels panel={panel} operationsPanel={OperationsPanel} />;
      </div>
      <main className={styles('scene')}>
        <X3dScene label={solid} />
      </main>
      <div className={styles('menu')}>
        <NavMenu solid={solid} onClick={focusOnHeader} />
      </div>
    </section>
  );
});
