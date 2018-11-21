import React from 'react';
import { makeStyles } from 'styles';

import { Table } from 'math/polyhedra/tables';
import { media, fonts } from 'styles';
import Description from './Description';
import PolyhedronTable from './PolyhedronTable';
import { TableSection as TableSectionType } from './tableSections';

const sectionMapping: Record<string, string> = {
  'Uniform Polyhedra': 'uniform',
  'Johnson Solids': 'johnson',
  'Pyramids, Cupoplæ, and Rotundæ': 'capstones',
  'Augmented, Diminished, and Gyrate Polyhedra': 'cutPaste',
  'Elementary Johnson Solids': 'elementary',
};

const gridAreaMapping: Record<string, string> = {
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

const styles = makeStyles({
  // Section styles
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

  // Other styles
  section: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ':not(:last-child)': {
      marginBottom: 50,
    },
  },

  grid: {
    display: 'grid',
    gridRowGap: 50,
    gridColumnGap: 30,
    justifyItems: 'center',
  },

  description: {
    maxWidth: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 50px',
    marginBottom: 30,
    [media.mobile]: {
      padding: '0 30px',
    },
  },

  sectionHeader: {
    fontFamily: fonts.times,
    fontSize: 24,
    marginBottom: 20,
  },

  subsectionHeader: {
    fontFamily: fonts.times,
    fontSize: 20,
    marginBottom: 15,
  },
});

const GridArea = ({ area, data }: { area: string; data: Table }) => {
  return (
    <div style={{ gridArea: area }}>
      <PolyhedronTable {...data} />
    </div>
  );
};

const TableGrid = ({
  tables,
  header,
}: Pick<TableSectionType, 'tables' | 'header'>) => {
  return (
    <div className={styles('grid', sectionMapping[header])}>
      {tables!.map(table => {
        const area = gridAreaMapping[table.caption];
        return <GridArea key={area} area={area} data={table} />;
      })}
    </div>
  );
};

interface Props {
  data: TableSectionType;
  narrow?: boolean;
  isSubsection?: boolean;
}

export default function TableSection({
  data,
  narrow = false,
  isSubsection = false,
}: Props) {
  const {
    header,
    description,
    tables,
    narrowTables,
    subsections,
    sticky,
  } = data;
  const Header = isSubsection ? 'h3' : 'h2';
  const headerStyle = isSubsection ? 'subsectionHeader' : 'sectionHeader';

  return (
    <div key={header} className={styles('section')}>
      {typeof description !== 'undefined' && (
        <div className={styles('description')}>
          <Header className={styles(headerStyle)}>{header}</Header>
          <Description
            title={header}
            content={description}
            collapsed={!sticky}
          />
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
