import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite'

import johnsonNames from '../data/groups/johnson.json'
import PolyhedronLink from './PolyhedronLink'

const styles = StyleSheet.create({
  table: {
    margin: 15,
  },
  cell: {
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: 10,
    maxWidth: 70,
  },
})

// FIXME I think these are duplicated to a certain extent from the data.
// Move these over to the "data" section
const prismNames = {
  3: 'triangular',
  4: 'square',
  5: 'pentagonal',
  6: 'hexagonal',
  8: 'octagonal',
  10: 'decagonal',
}

const platonicMapping = {
  T: 'tetrahedron',
  C: 'cube',
  O: 'octahedron',
  D: 'dodecahedron',
  I: 'icosahedron',
}

const archimedeanMapping = {
  tT: 'truncated tetrahedron',
  aC: 'cuboctahedron',
  tC: 'truncated cube',
  tO: 'truncated octahedron',
  eC: 'rhombicuboctahedron',
  bC: 'truncated cuboctahedron',
  sC: 'snub cube',
  aD: 'icosidodecahedron',
  tD: 'truncated dodecahedron',
  tI: 'truncated icosahedron',
  eD: 'rhombicosidodecahedron',
  bD: 'truncated icosidodecahedron',
  sD: 'snub dodecahedron',
}

const getPolyhedronFor = notation => {
  const prefix = notation[0]
  const number = notation.substring(1)
  if (platonicMapping[notation]) {
    return platonicMapping[notation]
  }
  if (archimedeanMapping[notation]) {
    return archimedeanMapping[notation]
  }
  if (prefix === 'J') {
    return johnsonNames[number - 1]
  }
  if (prefix === 'P') {
    return `${prismNames[number]} prism`
  }
  if (prefix === 'A') {
    return `${prismNames[number]} antiprism`
  }
  return null
}

const Cell = ({ cell, colSpan = 1 }) => {
  const polyhedron = getPolyhedronFor(cell)
  return (
    <td className={css(styles.cell)} colSpan={colSpan}>
      {polyhedron ? <PolyhedronLink name={polyhedron} /> : cell}
    </td>
  )
}

export default function PolyhedronTable({ rows, columns, data }) {
  return (
    <table className={css(styles.table)}>
      <thead>
        <tr>
          <th />
          {columns.map((col, j) => (
            <th
              className={css(styles.cell)}
              key={j}
              colSpan={_.isString(col) ? 1 : col.sub.length}
            >
              {_.isString(col) ? col : col.name}
            </th>
          ))}
        </tr>
        <tr>
          <th />
          {_.flatMap(
            columns,
            (col, j) =>
              _.isString(col) ? (
                <th key={j} />
              ) : (
                col.sub.map(subCol => (
                  <th className={css(styles.cell)} key={`${j}-${subCol}`}>
                    {subCol}
                  </th>
                ))
              ),
          )}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            <th className={css(styles.cell)}>{rows[i]}</th>
            {_.flatMap(row, (cell, j) => {
              const col = columns[j]
              if (_.isString(col)) {
                return <Cell key={j} cell={cell} />
              } else if (!_.isArray(cell)) {
                return <Cell key={j} cell={cell} colSpan={col.sub.length} />
              } else {
                return cell.map((subcell, k) => (
                  <Cell key={`${j}-${k}`} cell={subcell} />
                ))
              }
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
