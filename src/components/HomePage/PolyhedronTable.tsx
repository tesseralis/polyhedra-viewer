import React from 'react';
import _ from 'lodash';

import { fromConwayNotation } from 'math/polyhedra/names';
import { Table } from 'math/polyhedra/tables';
import PolyhedronLink from './PolyhedronLink';
import { makeStyles, media, fonts } from 'styles';

const styles = makeStyles({
  table: {
    borderSpacing: 8,
    borderCollapse: 'separate',
  },
  caption: {
    fontSize: 16,
    fontFamily: fonts.times,
  },
  cell: {
    fontFamily: fonts.times,
    verticalAlign: 'middle',
    textAlign: 'center',
    color: 'DimGrey',
    [media.notMobile]: {
      fontSize: 14,
    },
    [media.mobile]: {
      fontSize: 12,
    },
  },
  label: {
    marginTop: 5,
  },
});

const Cell = ({ cell, colSpan = 1 }: { cell: string; colSpan?: number }) => {
  const isFake = cell[0] === '!';
  const polyhedron = fromConwayNotation(isFake ? cell.substring(1) : cell);

  const symbol = isFake ? `(${cell.substring(1)})` : cell;

  // Render a link for each cell, or a grayed-out link when indicated by an "!"
  return (
    <td className={styles('cell')} colSpan={colSpan}>
      {polyhedron ? <PolyhedronLink isFake={isFake} name={polyhedron} /> : cell}
      <div className={styles('label')}>{polyhedron && symbol}</div>
    </td>
  );
};

const ColumnHeaders = ({ columns }: Pick<Table, 'columns'>) => {
  return (
    <thead>
      {/* Render the subcolumn headers first, where they exist. */}
      <tr>
        <th />
        {_.flatMap(columns, (col, j) =>
          typeof col === 'string'
            ? [<th key={j} />]
            : col.sub.map(subCol => (
                <th className={styles('cell')} key={`${j}-${subCol}`}>
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
            className={styles('cell')}
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
    <table className={styles('table')}>
      <caption className={styles('caption')}>{caption}</caption>
      <ColumnHeaders columns={columns} />
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {/* Row header */}
            <th className={styles('cell')}>{rows[i]}</th>
            {_.flatMap(row, (cell, j) => {
              const col = columns[j];
              if (_.isArray(cell)) {
                return cell.map((subcell, k) => (
                  <Cell key={`${j}-${k}`} cell={subcell} />
                ));
              }
              if (typeof col === 'string') {
                return [<Cell key={j} cell={cell} />];
              }
              return [<Cell key={j} cell={cell} colSpan={col.sub.length} />];
              // If the cell does have subcells render and return them
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
