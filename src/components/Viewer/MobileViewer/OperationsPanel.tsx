
import React from 'react';
import { makeStyles } from 'styles';

import { OpGrid, Prompt, Options, ResizeButtons } from '../common';
import { media } from 'styles';

const styles = makeStyles({
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

  prompt: {
    marginTop: 10,
    marginBottom: 'auto',
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

export default function OperationsPanel() {
  return (
    <section className={styles('opPanel')}>
      <div className={styles('resizeButtons')}>
        <ResizeButtons />
      </div>
      <div className={styles('prompt')}>
        <Prompt />
      </div>
      <div className={styles('options')}>
        <Options />
      </div>
      <div className={styles('opGrid')}>
        <OpGrid />
      </div>
    </section>
  );
}
