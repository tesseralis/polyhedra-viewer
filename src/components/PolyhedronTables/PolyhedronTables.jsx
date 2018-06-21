// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { media, fonts } from 'styles';
import polyhedronTables, { narrowTable } from 'constants/polyhedronTables';

import { DeviceTracker } from 'components/DeviceContext';
import Markdown from './Markdown';
import PolyhedronTable from './PolyhedronTable';
import * as text from './text';

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
  polyhedronTables: {
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

const GridArea = ({ area, data }) => {
  return (
    <div style={{ gridArea: area }}>
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

function PolyhedronTables({ data }) {
  return (
    <main className={css(styles.polyhedronTables)}>
      <div className={css(styles.abstract)}>
        <h1 className={css(styles.header)}>Convex Polyhedra</h1>
        <Markdown source={text.abstract} />
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
      renderDesktop={() => <PolyhedronTables data={polyhedronTables} />}
      renderMobile={({ orientation }) => (
        <PolyhedronTables
          data={orientation === 'portrait' ? narrowTable : polyhedronTables}
        />
      )}
    />
  );
};
