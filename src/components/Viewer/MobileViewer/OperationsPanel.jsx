// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { OpGrid, Options, ResizeButtons } from '../common';
import { media } from 'styles';

const styles = StyleSheet.create({
  opPanel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'none',
    [media.mobilePortrait]: {
      padding: 10,
    },
  },

  resizeButtons: {
    pointerEvents: 'initial',
  },

  options: {
    marginTop: 'auto',
    marginBottom: 10,
  },

  opGrid: {
    width: '100%',
    pointerEvents: 'initial',
  },
});

export default function OperationsPanel({ solid }: *) {
  return (
    <section className={css(styles.opPanel)}>
      <div className={css(styles.resizeButtons)}>
        <ResizeButtons />
      </div>
      <div className={css(styles.options)}>
        <Options solid={solid} />
      </div>
      <div className={css(styles.opGrid)}>
        <OpGrid />
      </div>
    </section>
  );
}
