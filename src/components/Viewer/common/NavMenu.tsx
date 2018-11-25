import _ from 'lodash';
import React from 'react';
import {
  mdiFormatListBulleted,
  mdiInformationOutline,
  mdiSettings,
  mdiMathCompass,
  mdiCubeOutline,
} from '@mdi/js';

import { makeStyles } from 'styles';
import IconLink from './IconLink';

const styles = makeStyles({
  menu: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
    justifyItems: 'center',
  },
});

interface Props {
  solid: string;
  compact?: boolean;
  onClick?: () => void;
}

export default function NavMenu({
  solid,
  compact = false,
  onClick = _.noop,
}: Props) {
  return (
    <nav className={styles('menu')}>
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
