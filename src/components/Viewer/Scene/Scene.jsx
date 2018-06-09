// @flow
import React from 'react';
import X3dScene from './X3dScene';
import Overlay from './Overlay';
import { css, StyleSheet } from 'aphrodite/no-important';

interface Props {
  solid: string;
  panel: string;
}

const styles = StyleSheet.create({
  scene: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100%',
  },
});

export default function Scene({ solid, panel }: Props) {
  return (
    <main className={css(styles.scene)}>
      <X3dScene />
      <Overlay solid={solid} panel={panel} />
    </main>
  );
}
