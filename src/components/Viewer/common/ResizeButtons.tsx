
import React from 'react';
import { makeStyles } from 'styles';

import { TransitionCtx, PolyhedronCtx } from 'components/Viewer/context';

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

export default function ResizeButtons() {
  const polyhedron = PolyhedronCtx.useState();
  const { setPolyhedron } = PolyhedronCtx.useActions();
  const { isTransitioning } = TransitionCtx.useState();
  return (
    <div className={styles('buttons')}>
      <button
        disabled={isTransitioning}
        onClick={() => setPolyhedron(polyhedron.center())}
        className={styles('resetButton')}
      >
        Recenter
      </button>
      <button
        disabled={isTransitioning}
        onClick={() => setPolyhedron(polyhedron.normalizeToVolume(5))}
        className={styles('resetButton')}
      >
        Resize
      </button>
    </div>
  );
}
