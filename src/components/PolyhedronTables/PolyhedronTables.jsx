// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { media, fonts } from 'styles';
import polyhedronTables, {
  narrowTable,
  type TableSection as TableSectionType,
} from 'constants/polyhedronTables';

import { DeviceTracker } from 'components/DeviceContext';
import Markdown from './Markdown';
import PolyhedronTable from './PolyhedronTable';
import * as text from './text';

const sectionMapping = {
  'Uniform Polyhedra': 'uniform',
  'Johnson Solids': 'johnson',
  Capstones: 'capstones',
  'Augmented, Diminished, and Gyrate Polyhedra': 'augDimGyr',
  'Elementary Johnson Solids': 'elementary',
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

  capstones: {
    gridTemplateAreas: `"caps"`,
    [media.mobilePortrait]: {
      gridTemplateAreas: `"caps" "bi"`,
    },
  },

  augDimGyr: {
    gridTemplateAreas: `
      "aug"
      "icos"
      "rhombicos"
    `,
    [media.desktop]: {
      gridTemplateAreas: `
        "aug  icos"
        "aug  rhombicos"
      `,
    },
    [media.mobilePortrait]: {
      gridTemplateAreas: `
        "aug"
        "icos"
        "gyr"
        "dim"
      `,
    },
  },

  elementary: {
    gridTemplateAreas: `
      "snub"
      "other"
    `,
    [media.desktop]: {
      gridTemplateAreas: '"snub other"',
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

  sectionHeader: {
    fontFamily: fonts.hoeflerText,
    fontSize: 24,
    marginBottom: 20,
  },

  subsectionHeader: {
    fontFamily: fonts.hoeflerText,
    fontSize: 20,
    marginBottom: 15,
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

interface TableSectionProps {
  data: TableSectionType;
  isSubsection?: boolean;
}

function TableSection({ data, isSubsection = false }: TableSectionProps) {
  const { header, tables, subsections } = data;
  const Header = isSubsection ? 'h3' : 'h2';
  const headerStyle = isSubsection
    ? styles.subsectionHeader
    : styles.sectionHeader;
  return (
    <div key={header} className={css(styles.section)}>
      <Header className={css(headerStyle)}>{header}</Header>
      {tables && <TableGrid header={header} tables={tables} />}
      {subsections &&
        subsections.map(subsection => (
          <TableSection
            key={subsection.header}
            isSubsection
            data={subsection}
          />
        ))}
    </div>
  );
}

function PolyhedronTables({ data }) {
  return (
    <main className={css(styles.polyhedronTables)}>
      <div className={css(styles.abstract)}>
        <h1 className={css(styles.header)}>Convex Polyhedra</h1>
        <Markdown source={text.abstract} />
      </div>
      {data.map(sectionData => (
        <TableSection key={sectionData.header} data={sectionData} />
      ))}
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
