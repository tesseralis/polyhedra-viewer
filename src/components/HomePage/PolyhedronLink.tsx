import React from 'react';
import { Link } from 'react-router-dom';

import { escapeName } from 'math/polyhedra/names';
import { square, hover, flexRow } from 'styles/common';
import { useStyle, media, scales } from 'styles';

import 'styles/polyhedronIcons.css';

function scale(ratio: number) {
  return `scale(${ratio}, ${ratio})`;
}

interface Props {
  name: string;
  isFake: boolean;
}

const baseThumbnailSize = 150;

// using raw pixel values since we need to do math
const thumbnailSize = 64;
const mobThumbnailSize = 48;

function Image({ name }: Pick<Props, 'name'>) {
  const css = useStyle({
    ...flexRow('center', 'center'),
    // The spriting/scaling process makes everything a little off center
    // so we have to adjust
    paddingLeft: scales.spacing[1],
    [media.notMobile]: {
      transform: scale((thumbnailSize + 16) / baseThumbnailSize),
    },
    [media.mobile]: {
      transform: scale((mobThumbnailSize + 16) / baseThumbnailSize),
    },
  });
  return (
    <div {...css()}>
      <img className={`icon-${escapeName(name)}`} alt={name} />;
    </div>
  );
}

export default function PolyhedronLink({ name, isFake }: Props) {
  const escapedName = escapeName(name);

  const css = useStyle(
    {
      ...hover,
      ...(isFake ? { opacity: 0.5, filter: 'grayscale(50%)' } : {}),
      ...flexRow('center', 'center'),
      border: '1px LightGray solid',
      color: 'black',
      overflow: 'hidden',
      margin: 'auto', // center inside a table
      borderRadius: '.5rem',
      [media.notMobile]: square(thumbnailSize),
      [media.mobile]: square(mobThumbnailSize),
    },
    [isFake],
  );
  return (
    <Link
      {...css()}
      id={!isFake ? escapedName : undefined}
      to={'/' + escapedName}
      title={name}
    >
      <Image name={name} />
    </Link>
  );
}
