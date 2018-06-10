//@flow

import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { absolute } from 'styles/common';
import { IconLink, Title, Options } from '../common';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  title: {
    ...absolute('bottom', 'right'),
    pointerEvents: 'initial',
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },

  homeLink: {
    pointerEvents: 'initial',
    ...absolute('top', 'left'),
  },

  options: {
    margin: '0 50px',
    height: '100%',
  },
});

interface Props {
  solid: string;
}

export default function Overlay({ solid }: Props) {
  return (
    <div className={css(styles.overlay)}>
      <div className={css(styles.homeLink)}>
        <IconLink iconName="periodic-table" title="Table" replace to="/" />
      </div>
      <div className={css(styles.title)}>
        <Title name={solid} />
      </div>
      <div className={css(styles.options)}>
        <Options solid={solid} />
      </div>
    </div>
  );
}
