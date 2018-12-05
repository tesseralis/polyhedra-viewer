import _ from 'lodash';
import React from 'react';
import {
  mdiFormatListBulleted,
  mdiInformationOutline,
  mdiSettings,
  mdiMathCompass,
  mdiCubeOutline,
} from '@mdi/js';

import { useStyle } from 'styles';
import IconLink from './IconLink';

interface Props {
  solid: string;
  compact?: boolean;
  onClick?: () => void;
}

// TODO dedupe <IconLink> declarations
export default function NavMenu({
  solid,
  compact = false,
  onClick = _.noop,
}: Props) {
  const css = useStyle({
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    justifyItems: 'center',
  });

  return (
    <nav {...css()}>
      <IconLink
        replace
        to={`/${solid}/list`}
        title="List"
        iconName={mdiFormatListBulleted}
        iconOnly={compact}
        onClick={onClick}
      />
      <IconLink
        replace
        to={`/${solid}/info`}
        title="Info"
        iconName={mdiInformationOutline}
        iconOnly={compact}
      />
      <IconLink
        replace
        to={`/${solid}/options`}
        title="Options"
        iconName={mdiSettings}
        iconOnly={compact}
        onClick={onClick}
      />
      <IconLink
        replace
        to={`/${solid}/operations`}
        title="Operations"
        iconName={mdiMathCompass}
        iconOnly={compact}
        onClick={onClick}
      />
      <IconLink
        replace
        to={`/${solid}/full`}
        title="Fullscreen"
        iconName={mdiCubeOutline}
        iconOnly={compact}
        onClick={onClick}
        exact
      />
    </nav>
  );
}
