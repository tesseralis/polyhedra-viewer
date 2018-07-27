// @flow strict
import * as React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import _ from 'lodash';

import { getJohnsonSymmetry } from 'data';
import { fonts } from 'styles';
import {
  unescapeName,
  getType,
  toConwayNotation,
  getAlternateNames,
} from 'polyhedra/names';

import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/context';

const styles = StyleSheet.create({
  table: {
    width: 400, // FIXME don't hardcode
    margin: 10,
    borderSpacing: 8,
    borderCollapse: 'separate',
  },

  cell: {
    fontFamily: fonts.verdana,
    fontSize: 16,
  },
});

interface DatumDisplayProps {
  polyhedron: *;
  name: string;
}

interface InfoRow {
  title: string;
  // property: (props: DatumDisplayProps) => string;
  property: *;
}

function displayFaces({ polyhedron }) {
  const faceCounts = polyhedron.numFacesBySides();
  // TODO order by type of face
  return _
    .map(faceCounts, (count, type: string) => `${count}{${type}}`)
    .join(' + ');
}

// FIXME still doesn't work well... (e.g. decagonal antiprism)
function displaySymmetry({ polyhedron, name }) {
  if (polyhedron.isUniform()) {
    const symmetry = polyhedron.symmetry();
    if (name.includes('snub') || name.includes('prism')) {
      return symmetry;
    }
    return `${symmetry}_h`;
  }
  const { group, sub } = getJohnsonSymmetry(unescapeName(name));
  return `${group}_${sub}`;
}

const info: InfoRow[] = [
  { title: 'Name', property: ({ name }) => _.capitalize(unescapeName(name)) },
  { title: 'Type', property: ({ name }) => getType(name) },

  { title: 'Vertices', property: ({ polyhedron }) => polyhedron.numVertices() },
  { title: 'Edges', property: ({ polyhedron }) => polyhedron.numEdges() },
  { title: 'Faces', property: ({ polyhedron }) => polyhedron.numFaces() },
  {
    title: 'Vertex configuration',
    property: ({ polyhedron }) => {
      const vConfig = polyhedron.vertexConfiguration();
      const configKeys = _.keys(vConfig);
      if (configKeys.length === 1) return configKeys[0];
      // TODO possibly square notation but that's hard
      return (
        <ul>
          {_.map(vConfig, (count, type: string) => (
            <li>
              {count}({type})
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    title: 'Faces by type',
    property: displayFaces,
  },

  {
    title: 'Volume',
    property: ({ polyhedron: p }) =>
      `${_.round(p.volume() / Math.pow(p.edgeLength(), 3), 3)}`,
  },
  {
    title: 'Surface area',
    property: ({ polyhedron: p }) =>
      `${_.round(p.surfaceArea() / Math.pow(p.edgeLength(), 2), 3)}`,
  },

  { title: 'Symmetry', property: displaySymmetry },

  { title: 'Conway symbol', property: ({ name }) => toConwayNotation(name) },
  {
    title: 'Also known as',
    property: ({ name }) => getAlternateNames(name).join(', ') || 'None',
  },
];

function InfoPanel({ solidName, polyhedron }) {
  return (
    <table className={css(styles.table)}>
      <tbody>
        {info.map(({ title, property: Property }) => {
          return (
            <tr key={title}>
              <th className={css(styles.cell)}>{title}</th>
              <td className={css(styles.cell)}>
                <Property name={solidName} polyhedron={polyhedron} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default connect(
  WithPolyhedron,
  ['solidName', 'polyhedron'],
)(InfoPanel);
