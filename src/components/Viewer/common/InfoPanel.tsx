import React, { Fragment, ComponentType } from 'react';
import { makeStyles } from 'styles';
import _ from 'lodash';

import { polygonNames } from 'math/polygons';
import { fonts } from 'styles';

import { PolyhedronCtx } from 'components/Viewer/context';
import DataDownloader from './DataDownloader';
import { Polyhedron } from '../../../math/polyhedra';

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

function Sub({ children }: any) {
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

function groupedVertexConfig(config: string) {
  const array = config.split('.');
  let current = { type: '', count: 0 };
  const result: (typeof current)[] = [];
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

function getShortVertexConfig(config: string) {
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

interface RenderProps {
  polyhedron: Polyhedron;
}

function displayVertexConfig({ polyhedron }: RenderProps) {
  const vConfig = polyhedron.vertexConfiguration();
  const configKeys = _.keys(vConfig);
  // When there's only one type, just get it on its own
  if (configKeys.length === 1) return <>{configKeys[0]}</>;
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

function displayFaceTypes({ polyhedron }: RenderProps) {
  const faceCounts = polyhedron.numFacesBySides();
  // TODO verify order by type of face
  return (
    <ul>
      {_.map(faceCounts, (count, type: number) => (
        <li key={type}>
          {count} {polygonNames[type]}
          {count !== 1 ? 's' : ''}
        </li>
      ))}
    </ul>
  );
}

function displaySymmetry({ polyhedron }: RenderProps) {
  const symmetry = polyhedron.symmetry();
  const symName = polyhedron.symmetryName();
  const { group = '', sub } = symmetry;
  return (
    <Fragment>
      {_.capitalize(symName)}, {group}
      {sub ? <Sub>{sub}</Sub> : undefined}
    </Fragment>
  );
}

interface InfoRow {
  name: string;
  area: string;
  render: ComponentType<RenderProps>;
}

const info: InfoRow[] = [
  {
    name: 'Vertices',
    area: 'verts',
    render: ({ polyhedron }) => <>{polyhedron.numVertices()}</>,
  },
  {
    name: 'Edges',
    area: 'edges',
    render: ({ polyhedron }) => <>{polyhedron.numEdges()}</>,
  },
  {
    name: 'Faces',
    area: 'faces',
    render: ({ polyhedron }) => <>{polyhedron.numFaces()}</>,
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
    render: ({ polyhedron: p }) => <>≈{_.round(p.sphericity(), 3)}</>,
  },

  { name: 'Symmetry', area: 'sym', render: displaySymmetry },
  {
    name: 'Order',
    area: 'order',
    render: ({ polyhedron: p }) => <>{p.order()}</>,
  },
  {
    name: 'Also known as',
    area: 'alt',
    render: ({ polyhedron }: RenderProps) => {
      const alts = polyhedron.alternateNames();
      if (alts.length === 0) return <>--</>;
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

export default function InfoPanel() {
  const polyhedron = PolyhedronCtx.useState();
  return (
    <div className={styles('infoPanel')}>
      <h2 className={styles('solidName')}>
        {_.capitalize(polyhedron.name)}, {polyhedron.symbol()}
      </h2>
      <p className={styles('solidType')}>{polyhedron.type()}</p>
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
                <Renderer polyhedron={polyhedron} />
              </dt>
            </div>
          );
        })}
      </dl>
      <div className={styles('downloader')}>
        <DataDownloader solid={polyhedron.solidData} />
      </div>
    </div>
  );
}
