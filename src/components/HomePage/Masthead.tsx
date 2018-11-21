import React from 'react';
import { Link } from 'react-router-dom';

import { SrOnly, ExternalLink } from 'components/common';
import Markdown from './Markdown';
import { styled, media, fonts } from 'styles';
import * as text from './text';
import video from 'images/transitions.mp4';

const videoHeight = 300;

const Container = styled.div({
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

const Abstract = styled.div({
  maxWidth: 600,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const AuthorLink = styled(ExternalLink)({
  textDecoration: 'none',
  ':hover': {
    textDecoration: 'underline',
  },
});

const VideoLink = styled(Link)({
  marginRight: 10,
  // make smaller to hide weird video artifacts
  height: videoHeight - 2,
  width: videoHeight - 2,
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
});

const Title = styled.h1({
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

const Subtitle = styled.p({
  fontSize: 16,
  fontFamily: fonts.andaleMono,
  marginBottom: 20,
  fontColor: 'dimGray',
});

export default function Masthead() {
  return (
    <Container>
      <Abstract>
        <Title>Polyhedra Viewer</Title>
        <Subtitle>
          by <AuthorLink href="https://www.tessera.li">@tesseralis</AuthorLink>
        </Subtitle>
        <Markdown source={text.abstract} />
      </Abstract>
      <VideoLink to="/random">
        <SrOnly>View tetrahedron</SrOnly>
        <video muted autoPlay playsInline src={video} height={videoHeight} />
      </VideoLink>
    </Container>
  );
}
