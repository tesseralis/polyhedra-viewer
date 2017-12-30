import React from 'react'
import * as _ from 'lodash'

import johnsonNames from '../data/groups/johnson.json'
import PolyhedronLink from './PolyhedronLink'

const data = [
  // pyramids, cupolae, rotunda
  ['regular', 1, 2, 3, 4, 5, '', 6],
  [7, 8, 9, 18, 19, 20, '', 21],
  ['coplanar', 10, 11, 22, 23, 24, '', 25],
  [12, 'regular', 13, 27, 28, 30, 32, 34], // TODO ortho/gyro
  [14, 15, 16, 35, 'semiregular', 38, 40, 42],
  ['coplanar', 17, 'regular', 44, 45, 46, 47, 48],
]

const rowNames = [
  '',
  'elongated',
  'gyroelongated',
  'bi-',
  'elongated bi-',
  'gyroelongated bi-',
]

export default function PeriodicTable() {
  return (
    <table>
      <thead>
        <tr>
          <th />
          <th colSpan={3}>Pyramids</th>
          <th colSpan={3}>Cuploae</th>
          <th />
          <th>Rotunda</th>
        </tr>
        <tr>
          <th />
          <th>Triangular</th>
          <th>Square</th>
          <th>Pentagonal</th>
          <th>Triangular</th>
          <th>Square</th>
          <th>Pentagonal</th>
          <th />
          <th>Pentagonal</th>
        </tr>
      </thead>
      <tbody>
        { data.map((row, i) => (
          <tr>
          <th>{rowNames[i]}</th>
          {row.map(cell => (
              <td>
              {_.isString(cell) ? cell : <PolyhedronLink name={johnsonNames[cell-1]}/>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
