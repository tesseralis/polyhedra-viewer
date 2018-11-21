
import React from 'react';
import { makeStyles } from 'styles';

import { ResizeButtons, OpGrid } from '../common';

const styles = makeStyles({
  opPanel: {
    height: '100%',
    padding: '20px 10px',
    display: 'flex',
    flexDirection: 'column',
  },

  resizeButtons: {
    marginTop: 'auto',
  },
});

export default function OperationsPanel() {
  return (
    <section className={styles('opPanel')}>
      <OpGrid />
      <div className={styles('resizeButtons')}>
        <ResizeButtons />
      </div>
    </section>
  );
}
