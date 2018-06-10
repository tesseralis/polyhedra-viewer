// @flow strict
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/context';

import { andaleMono } from 'styles/fonts';
import { hover } from 'styles/common';

const styles = StyleSheet.create({
  buttons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: 10,
  },
  resetButton: {
    alignSelf: 'end',
    backgroundColor: 'white',
    borderColor: 'LightGray',
    height: 40,
    padding: 10,
    fontSize: 14,
    fontFamily: andaleMono,
    ...hover,
  },
});

class ResizeButtons extends Component<*> {
  render() {
    const { disabled, recenter, resize } = this.props;

    return (
      <div className={css(styles.buttons)}>
        <button
          disabled={disabled}
          onClick={recenter}
          className={css(styles.resetButton)}
        >
          Recenter
        </button>
        <button
          disabled={disabled}
          onClick={resize}
          className={css(styles.resetButton)}
        >
          Resize
        </button>
      </div>
    );
  }
}

export default connect(
  WithPolyhedron,
  { resize: 'resize', recenter: 'recenter', disabled: 'isTransitioning' },
)(ResizeButtons);
