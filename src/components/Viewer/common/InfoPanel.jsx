// @flow strict
import React from 'react';
import _ from 'lodash';

import { unescapeName, getType } from 'polyhedra/names';

import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/context';

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
];

function InfoPanel({ solidName, polyhedron }) {
  return (
    <table>
      <tbody>
        {info.map(({ title, property }) => {
          return (
            <tr key={title}>
              <td>{title}:</td>
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
