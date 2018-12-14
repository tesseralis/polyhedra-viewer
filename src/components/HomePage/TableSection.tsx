import React from 'react';
import { CSSProperties } from 'aphrodite';
import { useStyle } from 'styles';

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

const sectionStyles: Record<string, CSSProperties> = {
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
};

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
  const css = useStyle(
    {
      display: 'grid',
      gridRowGap: 50,
      gridColumnGap: 30,
      justifyItems: 'center',
      ...sectionStyles[sectionMapping[header]],
    },
    [header],
  );
  return (
    <div {...css()}>
      {tables!.map(table => {
        const area = gridAreaMapping[table.caption];
        return <GridArea key={area} area={area} data={table} />;
      })}
    </div>
  );
};

function Heading({ subsection, text }: { subsection: boolean; text: string }) {
  const H = subsection ? 'h3' : 'h2';
  const css = useStyle({
    fontFamily: fonts.times,
    ...(subsection
      ? {
          fontSize: 20,
          marginBottom: 15,
        }
      : {
          fontSize: 24,
          marginBottom: 20,
        }),
  });
  return <H {...css()}>{text}</H>;
}

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

  const css = useStyle({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ':not(:last-child)': {
      marginBottom: 50,
    },
  });

  const textCss = useStyle({
    maxWidth: 800,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 50px',
    marginBottom: 30,
    [media.mobile]: {
      padding: '0 30px',
    },
  });

  return (
    <section {...css()}>
      <div {...textCss()}>
        <Heading subsection={isSubsection} text={header} />
        <Description title={header} content={description} collapsed={!sticky} />
      </div>
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
    </section>
  );
}
