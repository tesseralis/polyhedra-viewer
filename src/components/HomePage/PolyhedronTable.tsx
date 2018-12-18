import React, { ThHTMLAttributes } from 'react';
import _ from 'lodash';

import { fromConwayNotation } from 'math/polyhedra/names';
import { Table } from 'math/polyhedra/tables';
import PolyhedronLink from './PolyhedronLink';
import { media, fonts, useStyle, scales } from 'styles';

function useCellStyle() {
  return useStyle({
    fontFamily: fonts.times,
    verticalAlign: 'middle',
    textAlign: 'center',
    color: 'DimGrey',
    [media.notMobile]: { fontSize: scales.font[6] },
    [media.mobile]: { fontSize: scales.font[7] },
  });
}

const Cell = ({ cell, colSpan = 1 }: { cell: string; colSpan?: number }) => {
  const isFake = cell[0] === '!';
  const polyhedron = fromConwayNotation(isFake ? cell.substring(1) : cell);

  const symbol = isFake ? `(${cell.substring(1)})` : cell;

  // Render a link for each cell, or a grayed-out link when indicated by an "!"
  const css = useCellStyle();
  const label = useStyle({ marginTop: scales.spacing[1] });
  return (
    <td {...css()} colSpan={colSpan}>
      {polyhedron ? <PolyhedronLink isFake={isFake} name={polyhedron} /> : cell}
      <div {...label()}>{polyhedron && symbol}</div>
    </td>
  );
};

function Th(props: ThHTMLAttributes<Element>) {
  const css = useCellStyle();
  return <th {...props} {...css()} />;
}

const ColumnHeaders = ({ columns }: Pick<Table, 'columns'>) => {
  return (
    <thead>
      {/* Render the subcolumn headers first, where they exist. */}
      <tr>
        <th />
        {_.flatMap(columns, (col, j) =>
          typeof col === 'string'
            ? [<th key={j} />]
            : col.sub.map(subCol => <Th key={`${j}-${subCol}`}>{subCol}</Th>),
        )}
      </tr>
      {/* Render the main column headers, making sure to span more than one column for those with subcolumns */}
      <tr>
        <th />
        {columns.map((col, j) => (
          <Th key={j} colSpan={typeof col !== 'string' ? col.sub.length : 1}>
            {typeof col !== 'string' ? col.name : col}
          </Th>
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
  const css = useStyle({
    borderSpacing: scales.spacing[2],
    borderCollapse: 'separate',
  });
  const captionCss = useStyle({
    fontSize: scales.font[5],
    fontFamily: fonts.times,
  });
  return (
    <table {...css()}>
      <caption {...captionCss()}>{caption}</caption>
      <ColumnHeaders columns={columns} />
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {/* Row header */}
            <Th>{rows[i]}</Th>
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
