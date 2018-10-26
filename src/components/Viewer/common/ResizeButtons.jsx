// @flow strict
import React from 'react';
import { makeStyles } from 'styles';

import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/context';

import { andaleMono } from 'styles/fonts';
import { hover } from 'styles/common';

const styles = makeStyles({
  buttons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: 10,
  },
  resetButton: {
    alignSelf: 'end',
    backgroundColor: 'white',
    border: '1px LightGray solid',
    height: 40,
    padding: 10,
    fontSize: 14,
    fontFamily: andaleMono,
    ...hover,
  },
});

function ResizeButtons({ disabled, recenter, resize }: *) {
  return (
    <div className={styles('buttons')}>
      <button
        disabled={disabled}
        onClick={recenter}
        className={styles('resetButton')}
      >
        Recenter
      </button>
      <button
        disabled={disabled}
        onClick={resize}
        className={styles('resetButton')}
      >
        Resize
      </button>
    </div>
  );
}

export default connect(
  WithPolyhedron,
  { resize: 'resize', recenter: 'recenter', disabled: 'isTransitioning' },
)(ResizeButtons);
