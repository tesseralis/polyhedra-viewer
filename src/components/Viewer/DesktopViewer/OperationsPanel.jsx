// @flow
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { ResizeButtons, OpGrid } from '../common';

const styles = StyleSheet.create({
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

export default class OperationsPanel extends Component<*> {
  render() {
    return (
      <section className={css(styles.opPanel)}>
        <OpGrid />
        <div className={css(styles.resizeButtons)}>
          <ResizeButtons />
        </div>
      </section>
    );
  }
}
