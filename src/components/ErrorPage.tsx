import React from 'react';
import { Link } from 'react-router-dom';

import { useStyle, fonts, fontSizes, media } from 'styles';
import { square, absoluteFull, flexColumn } from 'styles/common';
import image from 'images/sad-scutoid.png';
import { usePageTitle } from 'components/common';

function Image() {
  const css = useStyle({
    ...square(300),
    marginBottom: 10,
    [media.mobile]: square(200),
  });
  return <img {...css()} src={image} alt="" />;
}

function Title() {
  const css = useStyle({
    textAlign: 'center',
    fontFamily: fonts.andaleMono,
    marginBottom: 10,
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
  const css = useStyle({
    ...absoluteFull,
    ...flexColumn('center', 'center'),
  });

  return (
    <section {...css()}>
      <Image />
      <Title />
      <BackLink />
    </section>
  );
}
