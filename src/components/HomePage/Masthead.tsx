import React from 'react';
import { Link } from 'react-router-dom';

import { SrOnly, ExternalLink } from 'components/common';
import Markdown from './Markdown';
import { useStyle, media, fonts, fontSizes, spacing, dims } from 'styles';
import * as text from './text';
import video from 'images/transitions.mp4';
import { flexRow, flexColumn, padding, link } from 'styles/common';

const videoHeight = 300;

function VideoLink() {
  const css = useStyle({
    ...flexRow(undefined, 'center'),
    // make smaller to hide weird video artifacts
    height: videoHeight - 2,
    width: videoHeight - 2,
    overflow: 'hidden',
  });
  return (
    <Link {...css()} to="random">
      <SrOnly>View random polyhedron</SrOnly>
      <video muted autoPlay playsInline src={video} height={videoHeight} />
    </Link>
  );
}

function Title() {
  const css = useStyle({
    marginBottom: spacing.s2,
    fontSize: fontSizes.f2,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,

    [media.mobile]: {
      fontSize: fontSizes.f3,
    },
  });
  return <h1 {...css()}>Polyhedra Viewer</h1>;
}

function Subtitle() {
  const css = useStyle({
    fontSize: fontSizes.f5,
    fontFamily: fonts.andaleMono,
    marginBottom: spacing.s3,
    fontColor: 'DimGray',
  });

  const author = useStyle(link);

  return (
    <p {...css()}>
      by{' '}
      <ExternalLink {...author()} href="https://www.tessera.li">
        @tesseralis
      </ExternalLink>
    </p>
  );
}

function Abstract() {
  const css = useStyle({
    ...flexColumn('center'),
    maxWidth: dims.d6,
  });
  return (
    <div {...css()}>
      <Title />
      <Subtitle />
      <Markdown source={text.abstract} />
    </div>
  );
}

export default function Masthead() {
  const css = useStyle({
    ...padding(spacing.s4, spacing.s5),
    ...flexRow('center', 'center'),
    width: '100%',
    borderBottom: '1px solid LightGray',

    [media.mobilePortrait]: {
      flexDirection: 'column-reverse',
    },
  });

  return (
    <div {...css()}>
      <Abstract />
      <VideoLink />
    </div>
  );
}
