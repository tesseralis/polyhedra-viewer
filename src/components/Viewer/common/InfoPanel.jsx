// @flow strict
import * as React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import _ from 'lodash';

import { getJohnsonSymmetry } from 'data';
import { polygonNames } from 'constants/polygons';
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
    padding: 10,
    fontFamily: fonts.hoeflerText,
  },

  solidName: {
    fontSize: 22,
    marginBottom: 10,
  },

  solidType: {
    fontSize: 18,
    color: 'DimGrey',
    marginBottom: 20,
  },

  dataList: {
    display: 'grid',
    gridTemplateAreas: `
      "verts verts edges edges faces faces"
      "vconf vconf vconf ftype ftype ftype"
      "vol   vol   sa    sa    spher spher"
      "sym   sym   sym   sym   sym   sym"
      "alt   alt   alt   alt   alt   alt"
    `,
    gridRowGap: 10,
  },

  property: {
    marginBottom: 10,
  },

  propName: {
    fontSize: 16,
    marginBottom: 5,
  },

  propValue: {
    fontFamily: fonts.andaleMono,
    color: 'DimGrey',
  },
});

interface DatumDisplayProps {
  polyhedron: *;
  name: string;
}

interface InfoRow {
  title: string;
  area: string;
  property: *;
}

function displayFaces({ polyhedron }) {
  const faceCounts = polyhedron.numFacesBySides();
  // TODO order by type of face
  return (
    <ul>
      {_.map(faceCounts, (count, type: string) => (
        <li>
          {count} {polygonNames[type]}
          {count !== 1 ? 's' : ''}
        </li>
      ))}
    </ul>
  );
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
  {
    title: 'Vertices',
    area: 'verts',
    property: ({ polyhedron }) => polyhedron.numVertices(),
  },
  {
    title: 'Edges',
    area: 'edges',
    property: ({ polyhedron }) => polyhedron.numEdges(),
  },
  {
    title: 'Faces',
    area: 'faces',
    property: ({ polyhedron }) => polyhedron.numFaces(),
  },
  {
    title: 'Vertex configuration',
    area: 'vconf',
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
    area: 'ftype',
    property: displayFaces,
  },

  {
    title: 'Volume',
    area: 'vol',
    property: ({ polyhedron: p }) =>
      `${_.round(p.volume() / Math.pow(p.edgeLength(), 3), 3)}`,
  },
  {
    title: 'Surface area',
    area: 'sa',
    property: ({ polyhedron: p }) =>
      `${_.round(p.surfaceArea() / Math.pow(p.edgeLength(), 2), 3)}`,
  },
  {
    title: 'Sphericity',
    area: 'spher',
    property: ({ polyhedron: p }) => `${_.round(p.sphericity(), 3)}`,
  },

  { title: 'Symmetry', area: 'sym', property: displaySymmetry },

  {
    title: 'Also known as',
    area: 'alt',
    property: ({ name }) => {
      const alts = getAlternateNames(name);
      if (alts.length === 0) return '--';
      return <ul>{alts.map(alt => <li key={alt}>{alt}</li>)}</ul>;
    },
  },
];

function InfoPanel({ solidName, polyhedron }) {
  return (
    <div className={css(styles.table)}>
      <h2 className={css(styles.solidName)}>
        {_.capitalize(unescapeName(solidName))}, {toConwayNotation(solidName)}
      </h2>
      <div className={css(styles.solidType)}>{getType(solidName)}</div>
      <dl className={css(styles.dataList)}>
        {info.map(({ title, area, property: Property }) => {
          return (
            <div className={css(styles.property)} style={{ gridArea: area }}>
              <dd className={css(styles.propName)}>{title}</dd>
              <dt className={css(styles.propValue)}>
                <Property name={solidName} polyhedron={polyhedron} />
              </dt>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export default connect(
  WithPolyhedron,
  ['solidName', 'polyhedron'],
)(InfoPanel);
