import React, { memo } from 'react';

import { useStyle, dims } from 'styles';
import { flexRow } from 'styles/common';
import Sidebar from './Sidebar';
import Overlay from './Overlay';
import { X3dScene } from '../common';

interface Props {
  panel: string;
  solid: string;
}

// There's no good measure in the usual scale for the sidebar
// FIXME still try to get it to work?
const sidebarW = '24rem';

function Scene({ solid, full }: Pick<Props, 'solid'> & { full: boolean }) {
  const css = useStyle(
    {
      position: 'relative',
      width: full ? '100%' : `calc(100% - ${sidebarW})`,
      height: '100%',
      alignSelf: 'flex-start',
    },
    [full],
  );
  return (
    <div {...css()}>
      <X3dScene label={solid} />
      <Overlay solid={solid} />
    </div>
  );
}

function StyledSidebar({
  solid,
  panel,
  compact,
}: Props & { compact: boolean }) {
  const css = useStyle(
    compact
      ? {
          position: 'absolute',
          top: 0,
          right: 0,
        }
      : {
          position: 'relative',
          height: '100%',
          minWidth: sidebarW,
          maxWidth: sidebarW,
        },
    [compact],
  );
  return (
    <div {...css()}>
      <Sidebar panel={panel} solid={solid} compact={compact} />
    </div>
  );
}

export default memo(function DesktopViewer({ solid, panel }: Props) {
  const full = panel === 'full';

  const css = useStyle({
    ...flexRow(),
    position: 'fixed',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
  });
  return (
    <div {...css()}>
      <Scene solid={solid} full={full} />
      <StyledSidebar solid={solid} panel={panel} compact={full} />
    </div>
  );
});
