import React from 'react';
import { useStyle, spacing, dims } from 'styles';

import { NavMenu, Panels, useHiddenHeading } from '../common';
import { paddingHoriz, scroll } from 'styles/common';

import OperationsPanel from './OperationsPanel';

interface Props {
  panel: string;
  solid: string;
  compact?: boolean;
}

const menuH = dims.d3;

export default function Sidebar({ panel, solid, compact }: Props) {
  const [header, focusOnHeader] = useHiddenHeading(panel);

  const css = useStyle(
    {
      width: '100%',
      height: '100%',
      position: 'relative',
      display: 'grid',
      gridTemplateRows: `${menuH} 1fr`,
      gridTemplateAreas: '"menu" "content"',
      borderLeft: compact ? undefined : '1px solid LightGray',
    },
    [compact],
  );

  const navCss = useStyle(
    {
      ...paddingHoriz(spacing.s2),
      gridArea: 'menu',
      height: menuH,
      borderBottom: compact ? undefined : '1px solid LightGray',
    },
    [compact],
  );

  const contentCss = useStyle({
    ...scroll('y'),
    gridArea: 'content',
    position: 'relative',
  });
  return (
    <section {...css()}>
      <div {...navCss()}>
        <NavMenu solid={solid} compact={compact} onClick={focusOnHeader} />
      </div>
      {!compact && (
        <div {...contentCss()}>
          {header}
          <Panels panel={panel} operationsPanel={OperationsPanel} />
        </div>
      )}
    </section>
  );
}
