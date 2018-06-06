// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import IconLink from './IconLink';

const styles = StyleSheet.create({
  menu: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
  },
});

interface Props {
  solid: string;
  compact?: boolean;
}

export default function Menu({ solid, compact = false }: Props) {
  return (
    <nav className={css(styles.menu)}>
      <IconLink
        to="/"
        title="Table"
        iconName="periodic-table"
        iconOnly={compact}
        exact
      />
      <IconLink
        replace
        to={`/${solid}/list`}
        title="List"
        iconName="format-list-bulleted"
        iconOnly={compact}
      />
      <IconLink
        replace
        to={`/${solid}/options`}
        title="Options"
        iconName="settings"
        iconOnly={compact}
      />
      <IconLink
        replace
        to={`/${solid}/operations`}
        title="Operations"
        iconName="math-compass"
        iconOnly={compact}
      />
    </nav>
  );
}
