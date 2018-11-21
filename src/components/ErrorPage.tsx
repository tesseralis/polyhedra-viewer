
import React from 'react';
import { Link } from 'react-router-dom';

import { styled, fonts, media } from 'styles';
import image from 'images/sad-scutoid.png';
import { usePageTitle } from 'components/common';

const Section = styled.section({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
});

const Image = styled.img({
  width: 300,
  height: 300,
  marginBottom: 10,
  [media.mobile]: {
    width: 200,
    height: 200,
  },
});

const Title = styled.h1({
  textAlign: 'center',
  fontFamily: fonts.andaleMono,
  fontSize: 24,
  marginBottom: 10,
  [media.mobile]: {
    fontSize: 20,
  },
});

const BackLink = styled(Link)({
  fontFamily: fonts.andaleMono,
  textDecoration: 'none',
  fontSize: 18,

  ':hover': {
    textDecoration: 'underline',
  },
});

export default function ErrorPage() {
  usePageTitle('Error - Polyhedra Viewer');

  return (
    <Section>
      <Image src={image} alt="" />
      <Title>Uh oh! We don't know about that polyhedron!</Title>
      <BackLink to="/">Go back</BackLink>
    </Section>
  );
}
