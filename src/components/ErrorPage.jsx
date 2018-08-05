import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
// TODO reorganize images folder
import image from 'sad-scutoid.png';
import { Link } from 'react-router-dom';

import { fonts, media } from 'styles';

const styles = StyleSheet.create({
  errorPage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 10,
    [media.mobile]: {
      width: 200,
      height: 200,
    },
  },
  title: {
    textAlign: 'center',
    fontFamily: fonts.andaleMono,
    fontSize: 24,
    marginBottom: 10,
    [media.mobile]: {
      fontSize: 20,
    },
  },
  link: {
    fontFamily: fonts.andaleMono,
    textDecoration: 'none',
    fontSize: 18,

    ':hover': {
      textDecoration: 'underline',
    },
  },
});

export default function ErrorPage() {
  return (
    <section className={css(styles.errorPage)}>
      <img className={css(styles.image)} src={image} alt="" />
      <h1 className={css(styles.title)}>
        Uh oh! We don't know about that polyhedron!
      </h1>
      <Link className={css(styles.link)} to="/">
        Go back
      </Link>
    </section>
  );
}
