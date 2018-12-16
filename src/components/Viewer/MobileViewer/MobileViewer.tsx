import React, { memo } from 'react';
import _ from 'lodash';
import { CSSProperties } from 'aphrodite';

import { useStyle, media } from 'styles';
import { scroll } from 'styles/common';
import {
  BackLink,
  Title,
  NavMenu,
  X3dScene,
  Panels,
  useHiddenHeading,
} from '../common';

import OperationsPanel from './OperationsPanel';

function mobile(styles: (mobTitleH: number, menuH: number) => CSSProperties) {
  return {
    [media.mobileLandscape]: styles(45, 45),
    [media.mobilePortrait]: styles(60, 75),
  };
}

interface Props {
  panel: string;
  solid: string;
}

function Header({ solid }: Pick<Props, 'solid'>) {
  const css = useStyle({
    ...mobile(mobTitleH => ({
      height: mobTitleH,
    })),
    padding: '0 10px',
    borderBottom: '1px solid LightGray',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '40px 1fr 40px',
    alignItems: 'center',
    justifyItems: 'center',
  });
  return (
    <header {...css()}>
      <BackLink solid={solid} />
      <Title name={solid} />
    </header>
  );
}

function Content({ panel, header }: Pick<Props, 'panel'> & { header: any }) {
  const transparent = _.includes(['operations', 'full'], panel);
  const css = useStyle(
    {
      ...scroll('y'),
      gridArea: 'content',
      position: 'relative',
      zIndex: 100,
      ...(transparent
        ? { pointerEvents: 'none' }
        : { backgroundColor: 'rgba(255, 255, 255, 0.75)' }),
    },
    [transparent],
  );
  return (
    <div {...css()}>
      {header}
      <Panels panel={panel} operationsPanel={OperationsPanel} />;
    </div>
  );
}

export default memo(function MobileViewer({ panel, solid }: Props) {
  const [header, focusOnHeader] = useHiddenHeading(panel);

  const css = useStyle({
    position: 'relative',
    width: '100vw',
    height: '100vh',
    display: 'grid',
    gridTemplateAreas: '"title" "content" "menu"',
    ...mobile((mobTitleH, menuH) => ({
      gridTemplateRows: `${mobTitleH}px 1fr ${menuH}px`,
    })),
  });

  const sceneCss = useStyle({
    ...mobile((mobTitleH, menuH) => ({
      height: `calc(100vh - ${menuH}px - ${mobTitleH}px)`,
    })),
    zIndex: 0,
    gridArea: 'content',
    position: 'relative',
  });

  const navCss = useStyle({
    ...mobile(($, menuH) => ({
      height: menuH,
    })),
    gridArea: 'menu',
    padding: '5px 10px',

    borderTop: '1px solid LightGray',
  });

  return (
    <section {...css()}>
      <Header solid={solid} />
      <Content panel={panel} header={header} />
      <main {...sceneCss()}>
        <X3dScene label={solid} />
      </main>
      <div {...navCss()}>
        <NavMenu solid={solid} onClick={focusOnHeader} />
      </div>
    </section>
  );
});
