import React from 'react';
import { Link } from 'react-router-dom';

import { escapeName } from 'math/polyhedra/names';
import { hover } from 'styles/common';
import { makeStyles, media } from 'styles';

import 'styles/polyhedronIcons.css';

const baseThumbnailSize = 150;

const thumbnailSize = 65;
const mobThumbnailSize = 50;

function scale(ratio: number) {
  return `scale(${ratio}, ${ratio})`;
}

const styles = makeStyles({
  link: {
    ...hover,
    border: '1px LightGray solid',
    color: 'black',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    margin: 'auto', // center inside a table
    borderRadius: 10,
    [media.notMobile]: {
      width: thumbnailSize,
      height: thumbnailSize,
    },
    [media.mobile]: {
      width: mobThumbnailSize,
      height: mobThumbnailSize,
    },
  },

  imageWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    [media.notMobile]: {
      // The spriting/scaling process makes everything a little off center
      // so we have to adjust
      paddingLeft: 3,
      transform: scale((thumbnailSize + 15) / baseThumbnailSize),
    },
    [media.mobile]: {
      paddingLeft: 4,
      transform: scale((mobThumbnailSize + 15) / baseThumbnailSize),
    },
  },

  fake: {
    opacity: 0.5,
    filter: 'grayscale(50%)',
  },
});

interface Props {
  name: string;
  isFake: boolean;
}

export default function PolyhedronLink({ name, isFake }: Props) {
  const escapedName = escapeName(name);
  return (
    <Link
      id={!isFake ? escapedName : undefined}
      to={'/' + escapedName}
      className={styles('link', isFake && 'fake')}
      title={name}
    >
      <div className={styles('imageWrapper')}>
        <img className={`icon-${escapedName}`} alt={name} />;
      </div>
    </Link>
  );
}
