import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { hoeflerText, andaleMono } from 'styles/fonts';
import periodicTable from 'constants/periodicTable';

import PolyhedronTable from './PolyhedronTable';

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
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  grid: {
    display: 'grid',
    padding: 50,
    gridRowGap: 50,
    justifyItems: 'center',
    gridTemplateAreas: `
      "abs  abs    abs       abs"
      "U    U      U         U"
      "x    plato  prism     prism"
      "J    J      J         J"
      "caps caps   caps      caps"
      "aug  aug    icos      icos"
      "aug  aug    rhombicos rhombicos"
      "snub snub   other     other"
    `,
  },

  abstract: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    fontSize: 28,
  },

  wikiLink: {
    textDecoration: 'none',
    color: 'MediumBlue',

    ':hover': {
      textDecoration: 'underline',
    },
  },
});

const WikiLink = ({ href, children }) => {
  return (
    <a className={css(styles.wikiLink)} href={href}>
      {children}
    </a>
  );
};

const GridArea = ({ area, children, element = 'div', classes = [] }) => {
  const El = element;
  return (
    <El style={{ gridArea: area }} className={css(classes)}>
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

export default function PeriodicTable() {
  return (
    <main className={css(styles.wrapper)}>
      <div className={css(styles.grid)}>
        <GridArea area="abs" classes={styles.abstract}>
          <h1 className={css(styles.header)}>Periodic Table of Polyhedra</h1>
          <p className={css(styles.description)}>
            These tables are a categorization of the convex, regular-faced (CRF)
            polyhedra. These include the five{' '}
            <WikiLink href="http://en.wikipedia.org/wiki/Platonic_solid">
              Platonic solids
            </WikiLink>, the 13{' '}
            <WikiLink href="http://en.wikipedia.org/wiki/Archimedean_solid">
              Archimedean solids
            </WikiLink>, the infinite set of{' '}
            <WikiLink href="http://en.wikipedia.org/wiki/Prism_(geometry)">
              prisms
            </WikiLink>{' '}
            and{' '}
            <WikiLink href="http://en.wikipedia.org/wiki/Antiprism">
              antiprisms
            </WikiLink>, and the 92{' '}
            <WikiLink href="http://en.wikipedia.org/wiki/Johnson_solid">
              Johnson solids
            </WikiLink>. Select a solid to play around with it and to see its
            relationships with other polyhedra.
          </p>
        </GridArea>
        {periodicTable.map(section => {
          const area = gridAreaMapping[section.caption];
          if (section.type === 'subheader') {
            return (
              <GridArea
                key={area}
                area={area}
                element="h2"
                classes={styles.subheader}
              >
                {section.caption}
              </GridArea>
            );
          }
          return <PolyhedronTableArea key={area} area={area} data={section} />;
        })}
      </div>
    </main>
  );
}
