// @flow strict
import React from 'react';
import _ from 'lodash';
import { css, StyleSheet } from 'aphrodite/no-important';

import { flatMap } from 'utils';
import { hoeflerText } from 'styles/fonts';
import { fromConwayNotation } from 'polyhedra/names';
import { type Table } from 'constants/periodicTable';
import PolyhedronLink from './PolyhedronLink';
import * as media from 'styles/media';

const styles = StyleSheet.create({
  table: {
    // margin: 15,
  },
  caption: {
    fontSize: 16,
    fontFamily: hoeflerText,
    marginBottom: 15,
  },
  cell: {
    verticalAlign: 'middle',
    textAlign: 'center',
    fontWeight: hoeflerText,
    color: 'DimGrey',
    [media.notMobile]: {
      fontSize: 12,
    },
    [media.mobile]: {
      fontSize: 10,
    },
  },
});

const Cell = ({ cell, colSpan = 1 }: { cell: *, colSpan?: * }) => {
  const isFake = cell[0] === '!';
  const polyhedron = fromConwayNotation(isFake ? cell.substring(1) : cell);

  // Render a link for each cell, or a grayed-out link when indicated by an "!"
  return (
    <td className={css(styles.cell)} colSpan={colSpan}>
      {polyhedron ? <PolyhedronLink isFake={isFake} name={polyhedron} /> : cell}
    </td>
  );
};

const ColumnHeaders = ({ columns }) => {
  return (
    <thead>
      {/* Render the subcolumn headers first, where they exist. */}
      <tr>
        <th />
        {flatMap(
          columns,
          (col, j) =>
            typeof col === 'string'
              ? [<th key={j} />]
              : col.sub.map(subCol => (
                  <th className={css(styles.cell)} key={`${j}-${subCol}`}>
                    {subCol}
                  </th>
                )),
        )}
      </tr>
      {/* Render the main column headers, making sure to span more than one column for those with subcolumns */}
      <tr>
        <th />
        {columns.map((col, j) => (
          <th
            className={css(styles.cell)}
            key={j}
            colSpan={typeof col !== 'string' ? col.sub.length : 1}
          >
            {typeof col !== 'string' ? col.name : col}
          </th>
        ))}
      </tr>
    </thead>
  );
};

type Props = Table;

export default function PolyhedronTable({
  caption,
  rows,
  columns,
  data,
}: Props) {
  return (
    <table className={css(styles.table)}>
      <caption className={css(styles.caption)}>{caption}</caption>
      <ColumnHeaders columns={columns} />
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {/* Row header */}
            <th className={css(styles.cell)}>{rows[i]}</th>
            {flatMap(row, (cell, j) => {
              const col = columns[j];
              if (typeof col === 'string') {
                return [<Cell key={j} cell={cell} />];
              } else if (!_.isArray(cell)) {
                // If the cell does *not* have subcells, make it span the length of the subcolumns
                return [<Cell key={j} cell={cell} colSpan={col.sub.length} />];
              } else {
                // If the cell does have subcells render and return them
                return cell.map((subcell, k) => (
                  <Cell key={`${j}-${k}`} cell={subcell} />
                ));
              }
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
