import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite/no-important'

import PolyhedronTable from './PolyhedronTable'
import { hoeflerText, andaleMono } from '../styles/fonts'
import periodicTable from '../constants/periodicTable'

const gridAreaMapping = {
  'Platonic and Archimedean Solids': 'plato',
  'Prisms and Antiprisms': 'prism',
  'Pyramids, Cupoplæ, and Rotundæ': 'pyrCup',
  'Augmented Polyhedra': 'aug',
  'Diminished Icosahedra': 'icos',
  'Gyrate and Diminished Rhombicosidodecahedra': 'rhombicos',
  'Snub Antiprisms': 'snub',
  'Other Johnson Solids': 'other',
  'Johnson Solids': 'J',
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    minHeight: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '0 80px',
  },
  grid: {
    display: 'grid',
    gridGap: 25,
    justifyItems: 'center',
    alignItems: 'center',
    gridTemplateAreas: `
      "abs   abs   J pyrCup aug  rhombicos"
      "plato prism J pyrCup aug  rhombicos"
      "plato prism J pyrCup aug  snub"
      "plato prism J pyrCup icos other"
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
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: andaleMono,
  },

  description: {
    fontSize: 12,
    fontFamily: hoeflerText,
    color: 'DimGrey',
    lineHeight: '18px',
  },

  subheader: {
    marginLeft: 50,
    fontFamily: hoeflerText,
    transform: 'rotate(-90deg)',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },

  wikiLink: {
    textDecoration: 'none',
    color: 'MediumBlue',

    ':hover': {
      textDecoration: 'underline',
    },
  },
})

const WikiLink = ({ href, children }) => {
  return (
    <a className={css(styles.wikiLink)} href={href}>
      {children}
    </a>
  )
}

const GridArea = ({ area, children, element = 'div', classes = [] }) => {
  const El = element
  return (
    <El style={{ gridArea: area }} className={css(classes)}>
      {children}
    </El>
  )
}

const PolyhedronTableArea = ({ area, data }) => {
  return (
    <GridArea area={area}>
      <PolyhedronTable {...data} />
    </GridArea>
  )
}

export default function PeriodicTable() {
  return (
    <main className={css(styles.wrapper)}>
      <div className={css(styles.grid)}>
        <GridArea area="abs" classes={styles.abstract}>
          <h1 className={css(styles.header)}>Periodic Table of Polyhedra</h1>
          <p className={css(styles.description)}>
            This table is a categorization of the convex, regular-faced (CRF)
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
            </WikiLink>. When a solid is presented in a "repeated" position
            (e.g. a Platonic solid in the prism section) it is grayed out.
          </p>
        </GridArea>
        {periodicTable.map(section => {
          const area = gridAreaMapping[section.caption]
          if (section.type === 'subheader') {
            return (
              <GridArea area={area} element="h2" classes={styles.subheader}>
                {section.caption}
              </GridArea>
            )
          }
          return <PolyhedronTableArea area={area} data={section} />
        })}
      </div>
    </main>
  )
}
