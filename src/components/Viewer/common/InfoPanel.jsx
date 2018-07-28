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
    // fontFamily: fonts.hoeflerText,
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
      "sym   sym   sym   sym   order order"
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

  sub: {
    verticalAlign: 'sub',
    fontSize: 'smaller',
  },

  sup: {
    verticalAlign: 'super',
    fontSize: 'smaller',
  },
});

// FIXME use unicode or mathml instead
function Sub({ children }) {
  return <sub className={css(styles.sub)}>{children}</sub>;
}

function Sup({ children }) {
  return <sup className={css(styles.sup)}>{children}</sup>;
}

interface DatumDisplayProps {
  polyhedron: *;
  name: string;
}

interface InfoRow {
  name: string;
  area: string;
  property: *;
}

function groupedVertexConfig(config) {
  const array = config.split('.');
  const result = [];
  let current = { type: -1, count: 0 };
  _.each(array, type => {
    if (type === current.type) {
      current.count++;
    } else {
      if (current.count) result.push(current);
      current = { type, count: 1 };
    }
  });
  if (current.count) result.push(current);

  return result;
}

function displayVertexConfig(config) {
  const grouped = groupedVertexConfig(config);
  const children = _.map(grouped, (typeCount, i) => {
    const { type, count } = typeCount;
    const val =
      count === 1 ? (
        type
      ) : (
        <React.Fragment>
          {type}
          <Sup>{count}</Sup>
        </React.Fragment>
      );
    if (i === 0) return val;
    return <React.Fragment>.{val}</React.Fragment>;
  });
  return <span>{children}</span>;
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
    return `Polyhedral, ${symmetry}_h`;
  }
  const { group, sub } = getJohnsonSymmetry(unescapeName(name));
  return `n-gonal polyhedral, ${group}_${sub}`;
}

const info: InfoRow[] = [
  {
    name: 'Vertices',
    area: 'verts',
    property: ({ polyhedron }) => polyhedron.numVertices(),
  },
  {
    name: 'Edges',
    area: 'edges',
    property: ({ polyhedron }) => polyhedron.numEdges(),
  },
  {
    name: 'Faces',
    area: 'faces',
    property: ({ polyhedron }) => polyhedron.numFaces(),
  },
  {
    name: 'Vertex configuration',
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
              {count}({displayVertexConfig(type)})
            </li>
          ))}
        </ul>
      );
    },
  },
  {
    name: 'Faces by type',
    area: 'ftype',
    property: displayFaces,
  },

  {
    name: 'Volume',
    area: 'vol',
    property: ({ polyhedron: p }) => (
      <span>
        ≈{_.round(p.volume() / Math.pow(p.edgeLength(), 3), 3)}s<Sup>3</Sup>
      </span>
    ),
  },
  {
    name: 'Surface area',
    area: 'sa',
    property: ({ polyhedron: p }) => (
      <span>
        ≈{_.round(p.surfaceArea() / Math.pow(p.edgeLength(), 2), 3)}s<Sup>
          2
        </Sup>
      </span>
    ),
  },
  {
    name: 'Sphericity',
    area: 'spher',
    property: ({ polyhedron: p }) => `≈${_.round(p.sphericity(), 3)}`,
  },

  { name: 'Symmetry', area: 'sym', property: displaySymmetry },
  { name: 'Order', area: 'order', property: $ => '-1' },

  {
    name: 'Also known as',
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
        {info.map(({ name, area, property: Property }) => {
          return (
            <div className={css(styles.property)} style={{ gridArea: area }}>
              <dd className={css(styles.propName)}>{name}</dd>
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
