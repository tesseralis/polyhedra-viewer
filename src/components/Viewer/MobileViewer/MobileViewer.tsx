import React, { memo } from 'react';
import _ from 'lodash';
import { CSSProperties } from 'aphrodite';

import { useStyle, media, spacing, dims } from 'styles';
import { scroll, padding, paddingHoriz, flexRow } from 'styles/common';
import {
  BackLink,
  Title,
  NavMenu,
  X3dScene,
  Panels,
  useHiddenHeading,
} from '../common';

import OperationsPanel from './OperationsPanel';

function mobile(styles: (mobTitleH: string, navH: string) => CSSProperties) {
  return {
    [media.mobileLandscape]: styles('45px', '45px'),
    [media.mobilePortrait]: styles('64px', '64px'),
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
    ...paddingHoriz(spacing.s2),
    borderBottom: '1px solid LightGray',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: `${dims.d2} 1fr ${dims.d2}`,
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
    gridTemplateAreas: '"title" "content" "nav"',
    ...mobile((mobTitleH, navH) => ({
      gridTemplateRows: `${mobTitleH} 1fr ${navH}`,
    })),
  });

  const sceneCss = useStyle({
    ...mobile((mobTitleH, navH) => ({
      height: `calc(100vh - ${navH} - ${mobTitleH})`,
    })),
    zIndex: 0,
    gridArea: 'content',
    position: 'relative',
  });

  const navCss = useStyle({
    ...mobile(($, navH) => ({
      height: navH,
    })),
    ...flexRow('center'),
    gridArea: 'nav',
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
