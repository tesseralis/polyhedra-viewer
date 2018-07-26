// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import _ from 'lodash';

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
    title: 'Volume',
    property: p => `${_.round(p.volume() / Math.pow(p.edgeLength(), 3), 3)}`,
  },
  {
    title: 'Surface Area',
    property: p =>
      `${_.round(p.surfaceArea() / Math.pow(p.edgeLength(), 2), 3)}`,
  },

  { title: 'Vertex Configuration', property: () => '' },
  { title: 'Symmetry', property: () => '' },

  { title: 'Conway Symbol', property: ($, name) => toConwayNotation(name) },
  {
    title: 'Alternate Names',
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
              <th>{title}</th>
              <td>{property(polyhedron, solidName)}</td>
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
