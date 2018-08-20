// @flow strict
import React, { Fragment } from 'react';
import { makeStyles } from 'styles';
import _ from 'lodash';

import { polygonNames } from 'constants/polygons';
import { fonts } from 'styles';
import {
  unescapeName,
  getType,
  toConwayNotation,
  getAlternateNames,
} from 'polyhedra/names';
import { getSymmetry, getSymmetryName, getOrder } from 'polyhedra/symmetry';

import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/context';
import DataDownloader from './DataDownloader';

const styles = makeStyles({
  infoPanel: {
    height: '100%',
    borderSpacing: 8,
    borderCollapse: 'separate',
    padding: 20,
    fontFamily: fonts.times,
    display: 'flex',
    flexDirection: 'column',
  },

  solidName: {
    fontSize: 22,
    marginBottom: 5,
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
    gridRowGap: 15,
  },

  property: {
    marginBottom: 10,
  },

  propName: {
    fontSize: 18,
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

  // Superscript is implemented using Unicode superscripts
  // so we just need to adjust the style so it looks nice
  sup: {
    fontSize: 20,
  },

  downloader: {
    marginTop: 'auto',
  },
});

function Sub({ children }) {
  return <sub className={styles('sub')}>{children}</sub>;
}

function Sup({ children }: { children: number }) {
  if (children < 0 || children > 5) {
    throw new Error('Number not supported');
  }
  const value = (() => {
    switch (children) {
      case 1:
        return <Fragment>&#x00B9;</Fragment>;
      case 2:
        return <Fragment>&#x00B2;</Fragment>;
      case 3:
        return <Fragment>&#x00B3;</Fragment>;
      case 4:
        return <Fragment>&#x2074;</Fragment>;
      case 5:
        return <Fragment>&#x2075;</Fragment>;
      default:
        return children;
    }
  })();
  return <sup className={styles('sup')}>{value}</sup>;
}

interface InfoRow {
  name: string;
  area: string;
  render: *;
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

function getShortVertexConfig(config) {
  const grouped = groupedVertexConfig(config);
  const children = _.map(grouped, (typeCount, i) => {
    const { type, count } = typeCount;
    const val =
      count === 1 ? (
        type
      ) : (
        <Fragment>
          {type}
          <Sup>{count}</Sup>
        </Fragment>
      );
    if (i === 0) return val;
    return <Fragment>.{val}</Fragment>;
  });
  return <Fragment>{children}</Fragment>;
}

function displayVertexConfig({ polyhedron }) {
  const vConfig = polyhedron.vertexConfiguration();
  const configKeys = _.keys(vConfig);
  // When there's only one type, just get it on its own
  if (configKeys.length === 1) return configKeys[0];
  return (
    <ul>
      {_.map(vConfig, (count, type: string) => (
        <li key={type}>
          {count}({getShortVertexConfig(type)})
        </li>
      ))}
    </ul>
  );
}

function displayFaceTypes({ polyhedron }) {
  const faceCounts = polyhedron.numFacesBySides();
  // TODO order by type of face
  return (
    <ul>
      {_.map(faceCounts, (count, type: string) => (
        <li key={type}>
          {count} {polygonNames[type]}
          {count !== 1 ? 's' : ''}
        </li>
      ))}
    </ul>
  );
}

function displaySymmetry({ polyhedron, name }) {
  const symmetry = getSymmetry(name);
  const symName = getSymmetryName(symmetry);
  const { group = '', sub } = symmetry;
  return (
    <Fragment>
      {_.capitalize(symName)}, {group}
      {sub ? <Sub>{sub}</Sub> : undefined}
    </Fragment>
  );
}

const info: InfoRow[] = [
  {
    name: 'Vertices',
    area: 'verts',
    render: ({ polyhedron }) => polyhedron.numVertices(),
  },
  {
    name: 'Edges',
    area: 'edges',
    render: ({ polyhedron }) => polyhedron.numEdges(),
  },
  {
    name: 'Faces',
    area: 'faces',
    render: ({ polyhedron }) => polyhedron.numFaces(),
  },
  {
    name: 'Vertex configuration',
    area: 'vconf',
    render: displayVertexConfig,
  },
  {
    name: 'Faces by type',
    area: 'ftype',
    render: displayFaceTypes,
  },

  {
    name: 'Volume',
    area: 'vol',
    render: ({ polyhedron: p }) => (
      <Fragment>
        ≈{_.round(p.normalizedVolume(), 3)}s<Sup>{3}</Sup>
      </Fragment>
    ),
  },
  {
    name: 'Surface area',
    area: 'sa',
    render: ({ polyhedron: p }) => (
      <Fragment>
        ≈{_.round(p.normalizedSurfaceArea(), 3)}s<Sup>{2}</Sup>
      </Fragment>
    ),
  },
  {
    name: 'Sphericity',
    area: 'spher',
    render: ({ polyhedron: p }) => `≈${_.round(p.sphericity(), 3)}`,
  },

  { name: 'Symmetry', area: 'sym', render: displaySymmetry },
  { name: 'Order', area: 'order', render: ({ name }) => getOrder(name) },

  {
    name: 'Also known as',
    area: 'alt',
    render: ({ name }) => {
      const alts = getAlternateNames(name);
      if (alts.length === 0) return '--';
      return (
        <ul>
          {alts.map(alt => (
            <li key={alt}>{alt}</li>
          ))}
        </ul>
      );
    },
  },
];

function InfoPanel({ solidName, polyhedron }) {
  return (
    <div className={styles('infoPanel')}>
      <h2 className={styles('solidName')}>
        {_.capitalize(unescapeName(solidName))}, {toConwayNotation(solidName)}
      </h2>
      <p className={styles('solidType')}>{getType(solidName)}</p>
      <dl className={styles('dataList')}>
        {info.map(({ name, area, render: Renderer }) => {
          return (
            <div
              key={name}
              className={styles('property')}
              style={{ gridArea: area }}
            >
              <dd className={styles('propName')}>{name}</dd>
              <dt className={styles('propValue')}>
                <Renderer name={solidName} polyhedron={polyhedron} />
              </dt>
            </div>
          );
        })}
      </dl>
      <div className={styles('downloader')}>
        <DataDownloader solid={polyhedron.solidData} name={solidName} />
      </div>
    </div>
  );
}

export default connect(
  WithPolyhedron,
  ['solidName', 'polyhedron'],
)(InfoPanel);
