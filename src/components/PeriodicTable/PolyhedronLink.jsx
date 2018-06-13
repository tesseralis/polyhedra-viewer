// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { Link } from 'react-router-dom';

import { escapeName } from 'polyhedra/names';
import { hover } from 'styles/common';

const thumbnailSize = 80;

const styles = StyleSheet.create({
  link: {
    ...hover,
    width: thumbnailSize,
    height: thumbnailSize,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    margin: 'auto', // center inside a table
  },

  image: {
    height: thumbnailSize + 10,
  },

  fake: {
    opacity: 0.25,
    filter: 'grayscale(50%)',
  },
});

interface Props {
  name: string;
  isFake: boolean;
}

export default function PolyhedronLink({ name, isFake }: Props) {
  const escapedName = escapeName(name);
  const img = require(`images/${escapedName}.png`);
  return (
    <Link
      to={'/' + escapedName}
      className={css(styles.link, isFake && styles.fake)}
      title={name}
    >
      <img className={css(styles.image)} src={img} alt={name} />
    </Link>
  );
}
