import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite'
import PolyhedronTable from './PolyhedronTable'

const pyramidCuploaeData = [
  // pyramids, cupolae, rotunda
  ['regular', 1, 2, 3, 4, 5, '', 6],
  [7, 8, 9, 18, 19, 20, '', 21],
  ['coplanar', 10, 11, 22, 23, 24, '', 25],
  [
    12,
    'regular',
    13,
    [27, 'semiregular'],
    [28, 29],
    [30, 31],
    [32, 33],
    [34, 'semiregular'],
  ],
  [14, 15, 16, [35, 36], ['semiregular', 37], [38, 39], [40, 41], [42, 43]],
  ['coplanar', 17, 'regular', 44, 45, 46, 47, 48],
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
    [49, 50, 51],
    [52, 53],
    [54, [55, 56], 57],
    [58, [59, 60], 61],
    [65],
    [66, 67],
    [68, [69, 70], 71],
  ],
}

const rhombicosidodecahedra = {
  rows: [
    '',
    'diminished',
    'parabidiminished', // FIXME para/meta
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
    ['semiregular', 72, [73, 74], 75],
    [76, [77, 78], 79],
    [80],
    [81, 82],
    [83],
  ],
}

export default function PeriodicTable() {
  return (
    <div>
      <PolyhedronTable {...pyramidsCupolae} />
      <PolyhedronTable {...augmentedSolids} />
      <PolyhedronTable {...rhombicosidodecahedra} />
    </div>
  )
}
