//@flow

import React from 'react';
import { makeStyles } from 'styles';

import { absolute } from 'styles/common';
import { BackLink, Title, Options, Prompt } from '../common';

const styles = makeStyles({
  overlay: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  title: {
    ...absolute('bottom', 'left'),
    pointerEvents: 'initial',
    padding: 36,
    textAlign: 'right',
  },

  homeLink: {
    pointerEvents: 'initial',
    paddingLeft: 10,
    ...absolute('top', 'left'),
  },

  options: {
    margin: '0 50px',
    height: '100%',
  },

  prompt: {
    marginTop: 20,
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  },
});

interface Props {
  solid: string;
}

export default function Overlay({ solid }: Props) {
  return (
    <div className={styles('overlay')}>
      <div className={styles('homeLink')}>
        <BackLink solid={solid} />
      </div>
      <div className={styles('title')}>
        <Title name={solid} />
      </div>
      <div className={styles('prompt')}>
        <Prompt />
      </div>
      <div className={styles('options')}>
        <Options />
      </div>
    </div>
  );
}
