import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite'

import johnsonNames from '../data/groups/johnson.json'
import PolyhedronLink from './PolyhedronLink'

const rawData = [
  // pyramids, cupolae, rotunda
  ['regular', 1, 2, 3, 4, 5, '', 6],
  [7, 8, 9, 18, 19, 20, '', 21],
  ['coplanar', 10, 11, 22, 23, 24, '', 25],
  [12, 'regular', 13, 27, 28, 30, 32, 34], // TODO ortho/gyro
  [14, 15, 16, 35, 'semiregular', 38, 40, 42],
  ['coplanar', 17, 'regular', 44, 45, 46, 47, 48],
]

const tableData = _.zip(...rawData)
console.log(tableData)

const colNames = [
  '',
  'elongated',
  'gyroelongated',
  'bi-',
  'elongated bi-',
  'gyroelongated bi-',
]

const colGroups = [
  { name: 'Pyramids', span: 3 },
  { name: 'Cuploae', span: 3 },
  { name: '' },
  { name: 'Rotunda' },
]

const rowNames = [
  'Triangular',
  'Square',
  'Pentagonal',
  'Triangular',
  'Square',
  'Pentagonal',
  '',
  'Pentagonal',
]

const styles = StyleSheet.create({
  cell: {
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: 10,
  },
})

export default function PeriodicTable() {
  return (
    <table>
      <thead>
        {/* <tr>
          <th />
          {colGroups.map(colGroup => (
            <th colSpan={colGroup.span || 1}>{colGroup.name}</th>
          ))}
        </tr> */}
        <tr>
          <th />
          {colNames.map(col => (
            <th className={css(styles.cell)} key={col}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableData.map((row, i) => (
          <tr key={i}>
            <th className={css(styles.cell)}>{rowNames[i]}</th>
            {row.map((cell, j) => (
              <td className={css(styles.cell)} key={j}>
                {_.isString(cell) ? (
                  cell
                ) : (
                  <PolyhedronLink name={johnsonNames[cell - 1]} />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
