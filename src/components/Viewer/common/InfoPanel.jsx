// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import _ from 'lodash';

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

interface InfoRow {
  title: string;
  property(polyhedron: *, name: string): string;
}

function displayFaces(polyhedron) {
  const faceCounts = polyhedron.numFacesBySides();
  // TODO order by type of face
  const faceCountDisplay = _
    .map(faceCounts, (count, type: string) => `${count}{${type}}`)
    .join(' + ');
  return `${polyhedron.numFaces()} = ${faceCountDisplay}`;
}

const info: InfoRow[] = [
  { title: 'Name', property: ($, name) => _.capitalize(unescapeName(name)) },
  { title: 'Type', property: ($, name) => getType(name) },

  { title: 'Vertices', property: p => p.numVertices() },
  { title: 'Edges', property: p => p.numEdges() },
  { title: 'Faces', property: displayFaces },
  {
    title: 'Vertex configuration',
    property: p => {
      const vConfig = p.vertexConfiguration();
      const configKeys = _.keys(vConfig);
      if (configKeys.length === 1) return configKeys[0];
      // TODO possibly square notation but that's hard
      return _
        .map(vConfig, (count, type: string) => `${count}(${type})`)
        .join(' + '); // TODO list instead
    },
  },

  {
    title: 'Volume',
    property: p => `${_.round(p.volume() / Math.pow(p.edgeLength(), 3), 3)}`,
  },
  {
    title: 'Surface area',
    property: p =>
      `${_.round(p.surfaceArea() / Math.pow(p.edgeLength(), 2), 3)}`,
  },

  { title: 'Symmetry', property: () => '' },

  { title: 'Conway symbol', property: ($, name) => toConwayNotation(name) },
  {
    title: 'Also known as',
    property: ($, name) => getAlternateNames(name).join(', ') || 'None',
  },
];

function InfoPanel({ solidName, polyhedron }) {
  return (
    <table className={css(styles.table)}>
      <tbody>
        {info.map(({ title, property }) => {
          return (
            <tr key={title}>
              <th className={css(styles.cell)}>{title}</th>
              <td className={css(styles.cell)}>
                {property(polyhedron, solidName)}
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
