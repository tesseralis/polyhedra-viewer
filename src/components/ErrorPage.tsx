import React from 'react';
import { Link } from 'react-router-dom';

import { useStyle, fonts, fontSizes, media, spacing } from 'styles';
import { square } from 'styles/common';
import image from 'images/sad-scutoid.png';
import { usePageTitle } from 'components/common';

function Image() {
  const css = useStyle({
    ...square(300),
    [media.mobile]: square(200),
  });
  return <img {...css()} src={image} alt="" />;
}

function Title() {
  const css = useStyle({
    textAlign: 'center',
    fontFamily: fonts.andaleMono,
    fontSize: fontSizes.f3,
    [media.mobile]: {
      fontSize: fontSizes.f4,
    },
  });
  return <h1 {...css()}>Uh oh! We don't know about that polyhedron!</h1>;
}

function BackLink() {
  const css = useStyle({
    fontFamily: fonts.andaleMono,
    textDecoration: 'none',
    fontSize: fontSizes.f4,
    ':hover': {
      textDecoration: 'underline',
    },
  });
  return (
    <Link {...css()} to="/">
      Go back
    </Link>
  );
}

export default function ErrorPage() {
  usePageTitle('Error - Polyhedra Viewer');
  // TODO is there any way to *not* rely on defining the "full" width per page?
  const css = useStyle({
    width: '100vw',
    height: '100vh',

    display: 'grid',
    gridGap: spacing.s2,
    alignContent: 'center',
    justifyContent: 'center',
    justifyItems: 'center',
  });

  return (
    <section {...css()}>
      <Image />
      <Title />
      <BackLink />
    </section>
  );
}
