import React from 'react'
import * as _ from 'lodash'
import { css, StyleSheet } from 'aphrodite'

import johnsonNames from '../data/groups/johnson.json'
import PolyhedronLink from './PolyhedronLink'

const styles = StyleSheet.create({
  table: {
    margin: 20,
  },
  cell: {
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: 10,
    maxWidth: 70,
  },
})

const Cell = ({ cell, colSpan = 1 }) => (
  <td className={css(styles.cell)} colSpan={colSpan}>
    {_.isString(cell) ? cell : <PolyhedronLink name={johnsonNames[cell - 1]} />}
  </td>
)

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
                <th />
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
