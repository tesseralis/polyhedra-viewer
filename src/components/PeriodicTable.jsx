import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite'
import PolyhedronTable from './PolyhedronTable'

const platonicArchimedean = {
  caption: 'Platonic and Archimedean Solids',
  rows: [
    'platonic',
    'truncated',
    'rectified',
    'cantellated',
    'bevelled',
    'snub',
  ],
  columns: [
    { name: '', sub: ['tetrahedron'] },
    { name: '', sub: ['cube', 'octahedron'] },
    { name: '', sub: ['dodecahedron', 'icosahedron'] },
  ],
  data: [
    ['T', ['C', 'O'], ['D', 'I']],
    ['tT', ['tC', 'tO'], ['tD', 'tI']],
    ['!O', 'aC', 'aD'],
    ['!aC', 'eC', 'eD'],
    ['!tO', 'bC', 'bD'],
    ['!I', 'sC', 'sD'],
  ],
}

const prisms = {
  caption: 'Prisms and Antiprisms',
  rows: [
    'triangular',
    'square',
    'pentagonal',
    'hexagonal',
    'octagonal',
    'decagonal',
  ],
  columns: ['prism', 'antiprism'],
  data: _.zip(
    ['P3', '!C', 'P5', 'P6', 'P8', 'P10'],
    ['!O', 'A4', 'A5', 'A6', 'A8', 'A10'],
  ),
}

const pyramidsCupolae = {
  caption: 'Pyramids, Cupoplae, and Rotundae',
  rows: [
    'triangular pyramid',
    'square pyramid',
    'pentagonal pyramid',
    'fastigium (triangular prism)',
    'triangular cupola',
    'square cupola',
    'pentagonal cupola',
    'cupola-rotunda',
    'pentagonal rotunda',
  ],
  columns: [
    '',
    'elongated',
    'gyroelongated',
    { name: 'bi-', sub: ['ortho-', 'gyro-'] },
    { name: 'elongated bi-', sub: ['ortho-', 'gyro-'] },
    'gyroelongated bi-',
  ],
  data: _.zip(
    ['!T', 'J1', 'J2', '', 'J3', 'J4', 'J5', '', 'J6'],
    ['J7', 'J8', 'J9', '', 'J18', 'J19', 'J20', '', 'J21'],
    ['coplanar', 'J10', 'J11', '', 'J22', 'J23', 'J24', '', 'J25'],
    [
      'J12',
      '!O',
      'J13',
      ['coplanar', 'J26'],
      ['J27', '!aC'],
      ['J28', 'J29'],
      ['J30', 'J31'],
      ['J32', 'J33'],
      ['J34', '!aD'],
    ],
    [
      'J14',
      'J15',
      'J16',
      '',
      ['J35', 'J36'],
      ['!eC', 'J37'],
      ['J38', 'J39'],
      ['J40', 'J41'],
      ['J42', 'J43'],
    ],
    ['coplanar', 'J17', '!I', '', 'J44', 'J45', 'J46', 'J47', 'J48'],
  ),
}

const augmentedSolids = {
  caption: 'Augmented Polyhedra',
  rows: [
    'triangular prism',
    'pentagonal prism',
    'hexagonal prism',
    'dodecahedron',
    'truncated tetrahedron',
    'truncated cube',
    'truncated dodecahedron',
  ],
  columns: [
    'augmented',
    { name: 'biaugmented', sub: ['para-', 'meta-'] },
    'triaugmented',
  ],
  data: [
    ['J49', 'J50', 'J51'],
    ['J52', 'J53'],
    ['J54', ['J55', 'J56'], 'J57'],
    ['J58', ['J59', 'J60'], 'J61'],
    ['J65'],
    ['J66', 'J67'],
    ['J68', ['J69', 'J70'], 'J71'],
  ],
}

const diminishedIcosahedra = {
  caption: 'Diminished Icosahedra',
  rows: ['icosahedron'],
  columns: ['tridiminished', 'metabidiminished', 'augmented tridiminished'],
  data: [['J63', 'J62', 'J64']],
}

const rhombicosidodecahedra = {
  caption: 'Gyrate and Diminished Rhombicosidodecahedra',
  rows: [
    '',
    'diminished',
    'parabidiminished',
    'metabidiminished',
    'tridiminished',
  ],
  columns: [
    '',
    { name: 'gyrate', sub: ['para-', 'meta-'] },
    { name: 'bigyrate', sub: ['para-', 'meta-'] },
    'trigyrate',
  ],
  data: [
    ['!eD', 'J72', ['J73', 'J74'], 'J75'],
    ['J76', ['J77', 'J78'], 'J79'],
    ['J80'],
    ['J81', 'J82'],
    ['J83'],
  ],
}

const snubAntiprisms = {
  caption: 'Snub Antiprisms',
  rows: ['snub'],
  columns: ['disphenoid', 'triangular', 'square antiprism'],
  data: [['J84', '!I', 'J85']],
}

const other = {
  caption: 'Other Johnson Solids',
  rows: [''],
  columns: ['', '', '', '', '', '', ''],
  data: [['J86', 'J87', 'J88', 'J89', 'J90', 'J91', 'J92']],
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 40,
    display: 'grid',
    gridGap: '25px 40px',
  },

  abstract: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  header: {
    marginTop: 20,
    marginBottom: 20,
    fontSize: 20,
    fontWeight: 'bold',
  },

  description: {
    marginBottom: 20,
    fontSize: 12,
  },

  // TODO: Come up with a more reusable way to do CSS grid
  // Is it just me or is Grid not made to work for components?
  tail: {
    gridRow: '2 / span 3',
  },

  fullHeight: {
    gridRow: '1 / span 4',
  },

  doubleHeight: {
    gridRow: '1 / span 2',
  },

  threeRows: {
    gridRow: '1 / span 3',
  },

  twoColumns: {
    gridColumnEnd: 'span 2',
  },

  secondLine: {
    gridRow: '2',
  },

  thirdLine: {
    gridRow: '3',
  },

  fourthLine: {
    gridRow: '4',
  },
})

export default function PeriodicTable() {
  return (
    <div className={css(styles.wrapper)}>
      <div className={css(styles.twoColumns, styles.abstract)}>
        <h1 className={css(styles.header)}>Periodic Table of CRF Polyhedra</h1>
        <p className={css(styles.description)}>
          The following is a categorization of the convex, regular-faced (CRF)
          polyhedra. These include the five Platonic Solids, the thirteen
          Archimedean Solids, the infinite set of prisms and antiprisms (of
          which a subset is represented), and the ninety-two Johnson Solids.
          When a solid is presented in a "repeated" position (e.g. a Platonic
          solid in the prism table) it is grayed out.
        </p>
      </div>
      <div className={css(styles.tail)}>
        <PolyhedronTable {...platonicArchimedean} />
      </div>
      <div className={css(styles.tail)}>
        <PolyhedronTable {...prisms} />
      </div>
      <div className={css(styles.fullHeight)}>
        <PolyhedronTable {...pyramidsCupolae} />
      </div>
      <div className={css(styles.threeRows)}>
        <PolyhedronTable {...augmentedSolids} />
      </div>
      <div className={css(styles.fourthLine)}>
        <PolyhedronTable {...diminishedIcosahedra} />
      </div>
      <div className={css(styles.doubleHeight)}>
        <PolyhedronTable {...rhombicosidodecahedra} />
      </div>
      <div className={css(styles.thirdLine)}>
        <PolyhedronTable {...snubAntiprisms} />
      </div>
      <div className={css(styles.fourthLine)}>
        <PolyhedronTable {...other} />
      </div>
    </div>
  )
}
