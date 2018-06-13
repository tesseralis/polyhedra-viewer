import React from 'react';
import * as _ from 'lodash';
import { css, StyleSheet } from 'aphrodite/no-important';

import { hoeflerText } from 'styles/fonts';
import { fromConwayNotation } from 'polyhedra/names';
import PolyhedronLink from './PolyhedronLink';

const styles = StyleSheet.create({
  table: {
    // margin: 15,
  },
  caption: {
    fontSize: 18,
    fontFamily: hoeflerText,
    marginBottom: 15,
  },
  cell: {
    verticalAlign: 'middle',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: hoeflerText,
    color: 'DimGrey',
  },
});

const Cell = ({ cell, colSpan = 1 }) => {
  const isFake = cell[0] === '!';
  const polyhedron = fromConwayNotation(isFake ? cell.substring(1) : cell);

  // Render a link for each cell, or a grayed-out link when indicated by an "!"
  return (
    <td className={css(styles.cell)} colSpan={colSpan}>
      {polyhedron ? <PolyhedronLink isFake={isFake} name={polyhedron} /> : cell}
    </td>
  );
};

// Return whether this column has subcolumns
// (Right now, we check if it's a string or an object)
const hasSubColumn = column => !_.isString(column);

const ColumnHeaders = ({ columns }) => {
  return (
    <thead>
      {/* Render the subcolumn headers first, where they exist. */}
      <tr>
        <th />
        {_.flatMap(
          columns,
          (col, j) =>
            !hasSubColumn(col) ? (
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
      {/* Render the main column headers, making sure to span more than one column for those with subcolumns */}
      <tr>
        <th />
        {columns.map((col, j) => (
          <th
            className={css(styles.cell)}
            key={j}
            colSpan={hasSubColumn(col) ? col.sub.length : 1}
          >
            {hasSubColumn(col) ? col.name : col}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default function PolyhedronTable({ caption, rows, columns, data }) {
  return (
    <table className={css(styles.table)}>
      <caption className={css(styles.caption)}>{caption}</caption>
      <ColumnHeaders columns={columns} />
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {/* Row header */}
            <th className={css(styles.cell)}>{rows[i]}</th>
            {_.flatMap(row, (cell, j) => {
              const col = columns[j];
              if (!hasSubColumn(col)) {
                return <Cell key={j} cell={cell} />;
              } else if (!_.isArray(cell)) {
                // If the cell does *not* have subcells, make it span the length of the subcolumns
                return <Cell key={j} cell={cell} colSpan={col.sub.length} />;
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
