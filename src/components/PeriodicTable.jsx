import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite'
import PolyhedronTable from './PolyhedronTable'

const platonic = {
  rows: [
    'tetrahedron',
    '',
    'cube',
    'octahedron',
    '',
    'dodecahedron',
    'icosahedron',
  ],
  columns: [''],
  data: _.zip(['T', '', 'C', 'O', '', 'D', 'I']),
}

const archimedean = {
  // FIXME figure out some way not to have to repeat these
  rows: ['', '', '', '', '', '', ''],
  columns: ['', ''],
  data: _.zip(
    ['tT', 'aC', 'tC', 'tO', 'aD', 'tD', 'tI'],
    ['', 'eC', 'bC', 'sC', 'eD', 'bD', 'sD'],
  ),
}

const prisms = {
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
    ['P3', 'regular', 'P5', 'P6', 'P8', 'P10'],
    ['regular', 'A4', 'A5', 'A6', 'A8', 'A10'],
  ),
}

const pyramidCuploaeData = [
  ['regular', 'J1', 'J2', 'J3', 'J4', 'J5', '', 'J6'],
  ['J7', 'J8', 'J9', 'J18', 'J19', 'J20', '', 'J21'],
  ['coplanar', 'J10', 'J11', 'J22', 'J23', 'J24', '', 'J25'],
  [
    'J12',
    'regular',
    'J13',
    ['J27', 'semiregular'],
    ['J28', 'J29'],
    ['J30', 'J31'],
    ['J32', 'J33'],
    ['J34', 'semiregular'],
  ],
  [
    'J14',
    'J15',
    'J16',
    ['J35', 'J36'],
    ['semiregular', 'J37'],
    ['J38', 'J39'],
    ['J40', 'J41'],
    ['J42', 'J43'],
  ],
  ['coplanar', 'J17', 'regular', 'J44', 'J45', 'J46', 'J47', 'J48'],
]

const pyramidsCupolae = {
  rows: [
    'triangular pyramid',
    'square pyramid',
    'pentagonal pyramid',
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
    { name: 'bi-', sub: ['ortho', 'gyro'] },
    { name: 'elongated bi-', sub: ['ortho', 'gyro'] },
    'gyroelongated bi-',
  ],
  data: _.zip(...pyramidCuploaeData),
}

const augmentedSolids = {
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
    { name: 'biaugmented', sub: ['para', 'meta'] },
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
  rows: ['icosahedron'],
  columns: ['tridiminished', 'metabidiminished', 'augmented tridiminished'],
  data: [['J63', 'J62', 'J64']],
}

const rhombicosidodecahedra = {
  rows: [
    '',
    'diminished',
    'parabidiminished',
    'metabidiminished',
    'tridiminished',
  ],
  columns: [
    '',
    { name: 'gyrate', sub: ['para', 'meta'] },
    { name: 'bigyrate', sub: ['para', 'meta'] },
    'trigyrate',
  ],
  data: [
    ['semiregular', 'J72', ['J73', 'J74'], 'J75'],
    ['J76', ['J77', 'J78'], 'J79'],
    ['J80'],
    ['J81', 'J82'],
    ['J83'],
  ],
}

const gyrobifastigium = {
  rows: [''],
  columns: ['gyrobifastigium'],
  data: [['J26']],
}

const snubAntiprisms = {
  rows: ['snub'],
  columns: ['disphenoid', 'triangular', 'square antiprism'],
  data: [['J84', 'regular', 'J85']],
}

const other = {
  rows: ['coronae', 'other'],
  columns: ['', '', '', ''],
  data: [['J86', 'J87', 'J88', 'J89'], ['J90', 'J91', 'J92']],
}

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
  },

  subWrapper: {
    display: 'flex',
  },
})

export default function PeriodicTable() {
  return (
    <div className={css(styles.wrapper)}>
      <PolyhedronTable {...platonic} />
      <PolyhedronTable {...archimedean} />
      <PolyhedronTable {...prisms} />
      <PolyhedronTable {...pyramidsCupolae} />
      <div>
        <PolyhedronTable {...augmentedSolids} />
        <PolyhedronTable {...diminishedIcosahedra} />
      </div>
      <div>
        <PolyhedronTable {...rhombicosidodecahedra} />
        <div className={css(styles.subWrapper)}>
          <PolyhedronTable {...snubAntiprisms} />
          <PolyhedronTable {...gyrobifastigium} />
        </div>
        <PolyhedronTable {...other} />
      </div>
    </div>
  )
}
