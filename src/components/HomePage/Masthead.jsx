// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { Link } from 'react-router-dom';

import { SrOnly } from 'components/common';
import Markdown from './Markdown';
import splash from 'splash.mp4';
import { media, fonts } from 'styles';
import * as text from './text';

const videoHeight = 300;

const styles = StyleSheet.create({
  masthead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    // TODO these box shadow stylings are kinda weird
    boxShadow: 'inset 0 -1px 4px LightGray',
    padding: '20px 50px',

    [media.mobilePortrait]: {
      flexDirection: 'column-reverse',
    },
  },

  abstract: {
    maxWidth: 600,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  authorLink: {
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  video: {
    marginRight: 10,
    // make smaller to hide weird video artifacts
    height: videoHeight - 2,
    width: videoHeight - 2,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
  },

  title: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 36,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,

    [media.mobile]: {
      fontSize: 24,
    },
  },

  subtitle: {
    fontSize: 16,
    fontFamily: fonts.andaleMono,
    marginBottom: 20,
    fontColor: 'dimGray',
  },
});

export default function Masthead() {
  return (
    <div className={css(styles.masthead)}>
      <div className={css(styles.abstract)}>
        <h1 className={css(styles.title)}>Polyhedra Viewer</h1>
        <p className={css(styles.subtitle)}>
          by{' '}
          <a className={css(styles.authorLink)} href="https://www.tessera.li">
            @tesseralis
          </a>
        </p>
        <Markdown source={text.abstract} />
      </div>
      <Link to="/tetrahedron" className={css(styles.video)}>
        <SrOnly>View tetrahedron</SrOnly>
        <video muted autoPlay playsInline src={splash} height={videoHeight} />
      </Link>
    </div>
  );
}
