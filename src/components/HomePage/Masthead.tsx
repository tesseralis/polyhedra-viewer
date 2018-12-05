import React from 'react';
import { Link } from 'react-router-dom';

import { SrOnly, ExternalLink } from 'components/common';
import Markdown from './Markdown';
import { useStyle, media, fonts } from 'styles';
import * as text from './text';
import video from 'images/transitions.mp4';

const videoHeight = 300;

function VideoLink() {
  const css = useStyle({
    marginRight: 10,
    // make smaller to hide weird video artifacts
    height: videoHeight - 2,
    width: videoHeight - 2,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
  });
  return (
    <Link {...css()} to="random">
      <SrOnly>View tetrahedron</SrOnly>
      <video muted autoPlay playsInline src={video} height={videoHeight} />
    </Link>
  );
}

function Title() {
  const css = useStyle({
    marginTop: 20,
    marginBottom: 15,
    fontSize: 36,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,

    [media.mobile]: {
      fontSize: 24,
    },
  });
  return <h1 {...css()}>Polyhedra Viewer</h1>;
}

function Subtitle() {
  const css = useStyle({
    fontSize: 16,
    fontFamily: fonts.andaleMono,
    marginBottom: 20,
    fontColor: 'dimGray',
  });

  const author = useStyle({
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  });

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
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    boxShadow: 'inset 0 -1px 4px LightGray',
    padding: '20px 50px',

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
