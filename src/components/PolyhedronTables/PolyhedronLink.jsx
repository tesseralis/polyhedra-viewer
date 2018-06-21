// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { Link } from 'react-router-dom';

import { escapeName } from 'polyhedra/names';
import { hover } from 'styles/common';
import { media } from 'styles';

const thumbnailSize = 70;

const mobThumbnailSize = 50;

const styles = StyleSheet.create({
  link: {
    ...hover,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    margin: 'auto', // center inside a table
    [media.notMobile]: {
      width: thumbnailSize,
      height: thumbnailSize,
    },
    [media.mobile]: {
      width: mobThumbnailSize,
      height: mobThumbnailSize,
    },
  },

  image: {
    [media.notMobile]: {
      height: thumbnailSize + 15,
    },
    [media.mobile]: {
      height: mobThumbnailSize + 15,
    },
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
