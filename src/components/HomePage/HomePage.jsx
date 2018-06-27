// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import splash from 'splash.mp4';
import { media, fonts } from 'styles';
import { type TableSection as TableSectionType } from 'constants/polyhedronTables';
import { DeviceTracker } from 'components/DeviceContext';

import Markdown from './Markdown';
import TableSection from './TableSection';
import tableSections from './tableSections';
import * as text from './text';

const videoHeight = 400;

const styles = StyleSheet.create({
  homePage: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorLink: {
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  splash: {
    // make smaller to hide weird video artifacts
    height: videoHeight - 2,
    width: 'auto',
    overflowY: 'hidden',
  },

  description: {
    maxWidth: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 50px',
    [media.mobile]: {
      margin: '0 30px',
    },
  },

  header: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,
    textAlign: 'center',
  },

  author: {
    fontSize: 16,
    fontFamily: fonts.andaleMono,
    marginBottom: 20,
    fontColor: 'dimGray',
  },

  sectionHeader: {
    fontFamily: fonts.hoeflerText,
    fontSize: 24,
    marginBottom: 20,
  },

  footer: {
    boxShadow: 'inset 1px 1px 4px LightGray',
    width: '100%',
    padding: 50,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
});

interface Props {
  data: TableSectionType[];
  narrow?: boolean;
}

function HomePage({ data, narrow = false }: Props) {
  return (
    <main className={css(styles.homePage)}>
      <div className={css(styles.splash)}>
        <video muted autoPlay loop src={splash} height={videoHeight} />
      </div>
      <div className={css(styles.description)}>
        <h1 className={css(styles.header)}>Polyhedra Viewer</h1>
        <p className={css(styles.author)}>
          by{' '}
          <a
            className={css(styles.authorLink)}
            href="https://github.com/tesseralis"
          >
            @tesseralis
          </a>
        </p>
        <Markdown source={text.abstract} />
      </div>
      {data.map(sectionData => (
        <TableSection
          narrow={narrow}
          key={sectionData.header}
          data={sectionData}
        />
      ))}
      <div className={css(styles.description)}>
        <h2 className={css(styles.sectionHeader)}>More Polyhedra</h2>
        <Markdown source={text.more} />
      </div>
      <div className={css(styles.footer)}>
        <Markdown source={text.footer} />
      </div>
    </main>
  );
}

export default () => {
  return (
    <DeviceTracker
      renderDesktop={() => <HomePage data={tableSections} />}
      renderMobile={({ orientation }) => (
        <HomePage narrow={orientation === 'portrait'} data={tableSections} />
      )}
    />
  );
};
