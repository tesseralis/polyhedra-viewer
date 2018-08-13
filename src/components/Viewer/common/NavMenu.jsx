// @flow strict

import _ from 'lodash';
import React from 'react';
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
        iconName="format-list-bulleted"
        iconOnly={compact}
        onClick={onClick}
      />
      <IconLink
        replace
        to={`/${solid}/info`}
        title="Info"
        iconName="information-outline"
        iconOnly={compact}
      />
      <IconLink
        replace
        to={`/${solid}/options`}
        title="Options"
        iconName="settings"
        iconOnly={compact}
        onClick={onClick}
      />
      <IconLink
        replace
        to={`/${solid}/operations`}
        title="Operations"
        iconName="math-compass"
        iconOnly={compact}
        onClick={onClick}
      />
      <IconLink
        replace
        to={`/${solid}/full`}
        title="Fullscreen"
        iconName="cube-outline"
        iconOnly={compact}
        onClick={onClick}
        exact
      />
    </nav>
  );
}
