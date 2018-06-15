// @flow strict
import React from 'react';
import Markdown from 'react-markdown';
import { css, StyleSheet } from 'aphrodite/no-important';

import { media, fonts } from 'styles';
import periodicTable, { narrowTable } from 'constants/periodicTable';

import { DeviceTracker } from 'components/DeviceContext';
import PolyhedronTable from './PolyhedronTable';

const sectionMapping = {
  'Uniform Polyhedra': 'uniform',
  'Johnson Solids': 'johnson',
};

const gridAreaMapping = {
  'Platonic and Archimedean Solids': 'plato',
  'Prisms and Antiprisms': 'prism',
  'Pyramids, Cupoplæ, and Rotundæ': 'caps',
  'Bipyramids, Cupoplæ, and Rotundæ': 'bi',
  'Augmented Polyhedra': 'aug',
  'Diminished Icosahedra': 'icos',
  'Gyrate and Diminished Rhombicosidodecahedra': 'rhombicos',
  'Gyrate Rhombicosidodecahedra': 'gyr',
  'Diminished Rhombicosidodecahedra': 'dim',
  'Snub Antiprisms': 'snub',
  'Other Johnson Solids': 'other',
};

const styles = StyleSheet.create({
  periodicTable: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 50,
  },

  grid: {
    display: 'grid',
    gridRowGap: 50,
    gridColumnGap: 30,
    justifyItems: 'center',
  },

  gridArea: {},

  uniform: {
    gridTemplateAreas: `
      "plato prism"
    `,
    [media.mobilePortrait]: {
      gridTemplateAreas: `
      "plato"
      "prism"
    `,
    },
  },

  johnson: {
    [media.desktop]: {
      gridTemplateAreas: `
      "caps caps"
      "aug  icos"
      "aug  rhombicos"
      "snub other"
    `,
    },
    [media.tabletPortrait]: {
      gridTemplateAreas: `
      "caps"
      "aug"
      "icos"
      "rhombicos"
      "snub"
      "other"
    `,
    },
    [media.mobileLandscape]: {
      gridTemplateAreas: `
      "caps"
      "aug"
      "icos"
      "rhombicos"
      "snub"
      "other"
    `,
    },
    [media.mobilePortrait]: {
      gridTemplateAreas: `
      "caps"
      "bi"
      "aug"
      "icos"
      "gyr"
      "dim"
      "snub"
      "other"
    `,
    },
  },

  abstract: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 50,
    maxWidth: 800,
  },

  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,
  },

  description: {
    fontSize: 16,
    fontFamily: fonts.hoeflerText,
    color: 'DimGrey',
    lineHeight: 1.5,
  },

  subheader: {
    fontFamily: fonts.hoeflerText,
    fontSize: 24,
    marginBottom: 20,
  },

  wikiLink: {
    textDecoration: 'none',
    color: 'MediumBlue',

    ':hover': {
      textDecoration: 'underline',
    },
  },
});

const Paragraph = ({ children }) => {
  return <p className={css(styles.description)}>{children}</p>;
};

const WikiLink = ({ href, children }) => {
  return (
    <a className={css(styles.wikiLink)} href={href}>
      {children}
    </a>
  );
};

const GridArea = ({ area, data }) => {
  return (
    <div style={{ gridArea: area }} className={css(styles.gridArea)}>
      <PolyhedronTable {...data} />
    </div>
  );
};

const TableGrid = ({ tables, header }) => {
  return (
    <div className={css(styles.grid, styles[sectionMapping[header]])}>
      {tables.map(table => {
        const area = gridAreaMapping[table.caption];
        return <GridArea key={area} area={area} data={table} />;
      })}
    </div>
  );
};

const description = `
  These tables are a categorization of the convex, regular-faced (CRF)
  polyhedra. These include the five [Platonic solids][platonic], the 13
  [Archimedean solids][archimedean], the infinite set of [prisms][prism]
  and [antiprisms][antiprism], and the 92 [Johnson solids][johnson].
  Select a solid to play around with it and to see its
  relationships with other polyhedra.

  [platonic]: http://en.wikipedia.org/wiki/Platonic_solid
  [archimedean]: http://en.wikipedia.org/wiki/Archimedean_solid
  [prism]: http://en.wikipedia.org/wiki/Prism_(geometry)
  [antiprism]: http://en.wikipedia.org/wiki/Antiprism
  [johnson]: http://en.wikipedia.org/wiki/Johnson_solid
`;

function PeriodicTable({ data }) {
  return (
    <main className={css(styles.periodicTable)}>
      <div className={css(styles.abstract)}>
        <h1 className={css(styles.header)}>Periodic Table of Polyhedra</h1>
        <Markdown
          source={description}
          renderers={{
            paragraph: Paragraph,
            linkReference: WikiLink,
          }}
        />
      </div>
      {data.map(({ header, tables }) => {
        return (
          <div key={header} className={css(styles.section)}>
            <h2 className={css(styles.subheader)}>{header}</h2>
            <TableGrid header={header} tables={tables} />
          </div>
        );
      })}
    </main>
  );
}

export default () => {
  return (
    <DeviceTracker
      renderDesktop={() => <PeriodicTable data={periodicTable} />}
      renderMobile={({ orientation }) => (
        <PeriodicTable
          data={orientation === 'portrait' ? narrowTable : periodicTable}
        />
      )}
    />
  );
};
