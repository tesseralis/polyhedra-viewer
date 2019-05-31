import React from 'react';
import { Link } from 'react-router-dom';

import { escapeName } from 'math/polyhedra/names';
import { square, hover, flexRow } from 'styles/common';
import { useStyle, media } from 'styles';

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
    [media.notMobile]: {
      transform: scale((thumbnailSize + 16) / baseThumbnailSize),
    },
    [media.mobile]: {
      transform: scale((mobThumbnailSize + 16) / baseThumbnailSize),
    },
  });
  const escapedName = escapeName(name);
  return (
    <img
      {...css()}
      alt={name}
      src={require(`images/thumbnails/${escapedName}.png`)}
    />
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
