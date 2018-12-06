import React from 'react';
import { Link } from 'react-router-dom';

import { escapeName } from 'math/polyhedra/names';
import { square, hover } from 'styles/common';
import { useStyle, media } from 'styles';

import 'styles/polyhedronIcons.css';

const baseThumbnailSize = 150;

const thumbnailSize = 65;
const mobThumbnailSize = 50;

function scale(ratio: number) {
  return `scale(${ratio}, ${ratio})`;
}

interface Props {
  name: string;
  isFake: boolean;
}

function Image({ name }: Pick<Props, 'name'>) {
  const css = useStyle({
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
      border: '1px LightGray solid',
      color: 'black',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      margin: 'auto', // center inside a table
      borderRadius: 10,
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
