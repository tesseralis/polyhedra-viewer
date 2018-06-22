// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

// FIXME move this somewhere else!
import { X3dScene } from 'components/Viewer/common';
import { media, fonts } from 'styles';
import polyhedronTables, {
  type TableSection as TableSectionType,
} from 'constants/polyhedronTables';

import { DeviceTracker } from 'components/DeviceContext';
import Markdown from './Markdown';
import PolyhedronTable from './PolyhedronTable';
import * as text from 'constants/text';

const sectionMapping = {
  'Uniform Polyhedra': 'uniform',
  'Johnson Solids': 'johnson',
  Capstones: 'capstones',
  'Augmented, Diminished, and Gyrate Polyhedra': 'cutPaste',
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

  cutPaste: {
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
    gridColumnGap: 50,
    gridTemplateAreas: `
      "snub"
      "other"
    `,
    [media.desktop]: {
      gridTemplateAreas: '"snub other"',
    },
  },

  abstract: {
    maxWidth: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 50,
  },

  // FIXME dedupe with abstract/markdown
  description: {
    maxWidth: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '0 50px',
  },

  header: {
    marginTop: 20,
    marginBottom: 15,
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: fonts.andaleMono,
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

  subsectionHeader: {
    fontFamily: fonts.hoeflerText,
    fontSize: 18,
    marginBottom: 15,
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
  narrow?: boolean;
  isSubsection?: boolean;
}

function TableSection({
  data,
  narrow = false,
  isSubsection = false,
}: TableSectionProps) {
  const { header, description, tables, narrowTables, subsections } = data;
  const Header = isSubsection ? 'h3' : 'h2';
  const headerStyle = isSubsection
    ? styles.subsectionHeader
    : styles.sectionHeader;

  return (
    <div key={header} className={css(styles.section)}>
      {description !== 'undefined' && (
        <div className={css(styles.description)}>
          <Header className={css(headerStyle)}>{header}</Header>
          <Markdown source={description} />
        </div>
      )}
      {tables && (
        <TableGrid
          header={header}
          tables={narrow ? narrowTables || tables : tables}
        />
      )}
      {subsections &&
        subsections.map(subsection => (
          <TableSection
            key={subsection.header}
            narrow={narrow}
            isSubsection
            data={subsection}
          />
        ))}
    </div>
  );
}

interface Props {
  data: TableSection[];
  narrow?: boolean;
}

function PolyhedronTables({ data, narrow = false }: Props) {
  return (
    <main className={css(styles.polyhedronTables)}>
      <X3dScene smol />
      <div className={css(styles.abstract)}>
        <h1 className={css(styles.header)}>Polyhedra Viewer</h1>
        <p className={css(styles.author)}>by @tesseralis</p>
        <Markdown source={text.abstract} />
      </div>
      {data.map(sectionData => (
        <TableSection
          narrow={narrow}
          key={sectionData.header}
          data={sectionData}
        />
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
          narrow={orientation === 'portrait'}
          data={polyhedronTables}
        />
      )}
    />
  );
};
