// @flow
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { OpGrid, Options, ResizeButtons } from '../common';

const styles = StyleSheet.create({
  opPanel: {
    height: '100%',
    padding: '0 10px',
    display: 'flex',
    flexDirection: 'column',
    pointerEvents: 'none',
  },

  resizeButtons: {
    pointerEvents: 'initial',
  },

  options: {
    marginTop: 10,
    marginBottom: 'auto',
    pointerEvents: 'initial',
  },

  opGrid: {
    width: '100%',
    marginTop: 'auto',
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
