// @flow strict
import React from 'react';
import Markdown from 'react-markdown';
import { css, StyleSheet, type StyleDefinition } from 'aphrodite/no-important';

import { hoeflerText, andaleMono } from 'styles/fonts';
import periodicTable from 'constants/periodicTable';

import PolyhedronTable from './PolyhedronTable';

const sectionMapping = {
  'Uniform Polyhedra': 'uniform',
  'Johnson Solids': 'johnson',
};

const gridAreaMapping = {
  'Platonic and Archimedean Solids': 'plato',
  'Prisms and Antiprisms': 'prism',
  'Pyramids, Cupoplæ, and Rotundæ': 'caps',
  'Augmented Polyhedra': 'aug',
  'Diminished Icosahedra': 'icos',
  'Gyrate and Diminished Rhombicosidodecahedra': 'rhombicos',
  'Snub Antiprisms': 'snub',
  'Other Johnson Solids': 'other',
  'Uniform Polyhedra': 'U',
  'Johnson Solids': 'J',
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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
  },

  johnson: {
    gridTemplateAreas: `
      "caps caps"
      "aug  icos"
      "aug  rhombicos"
      "snub other"
    `,
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
    fontFamily: andaleMono,
  },

  description: {
    fontSize: 16,
    fontFamily: hoeflerText,
    color: 'DimGrey',
    lineHeight: 1.5,
  },

  subheader: {
    fontFamily: hoeflerText,
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

interface GridAreaProps {
  area: *;
  children: React$Node;
  element?: string;
  classes?: StyleDefinition[];
}

const GridArea = ({
  area,
  children,
  element = 'div',
  classes = [],
}: GridAreaProps) => {
  const El = element;
  return (
    <El style={{ gridArea: area }} className={css(...classes)}>
      {children}
    </El>
  );
};

const PolyhedronTableArea = ({ area, data }) => {
  return (
    <GridArea area={area}>
      <PolyhedronTable {...data} />
    </GridArea>
  );
};

const TableGrid = ({ tables, header }) => {
  return (
    <div className={css(styles.grid, styles[sectionMapping[header]])}>
      {tables.map(table => {
        const area = gridAreaMapping[table.caption];
        return <PolyhedronTableArea key={area} area={area} data={table} />;
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

export default function PeriodicTable() {
  return (
    <main className={css(styles.wrapper)}>
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
      {periodicTable.map(({ header, tables }) => {
        return (
          <div className={css(styles.section)}>
            <h2 className={css(styles.subheader)}>{header}</h2>
            <TableGrid header={header} tables={tables} />
          </div>
        );
      })}
    </main>
  );
}
