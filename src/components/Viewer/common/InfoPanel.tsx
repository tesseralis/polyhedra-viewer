import React, { ComponentType } from 'react';
import { makeStyles } from 'styles';
import _ from 'lodash';

import { ChildrenProp } from 'types';
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

function Sub({ children }: ChildrenProp) {
  return <sub className={styles('sub')}>{children}</sub>;
}

function Sup({ children }: ChildrenProp<number>) {
  if (typeof children === 'undefined') {
    throw new Error('undefined child');
  }
  if (children < 0 || children > 5) {
    throw new Error('Number not supported');
  }
  const value = (() => {
    switch (children) {
      case 1:
        return <>&#x00B9;</>;
      case 2:
        return <>&#x00B2;</>;
      case 3:
        return <>&#x00B3;</>;
      case 4:
        return <>&#x2074;</>;
      case 5:
        return <>&#x2075;</>;
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
        <>
          {type}
          <Sup>{count}</Sup>
        </>
      );
    if (i === 0) return val;
    return <>.{val}</>;
  });
  return <>{children}</>;
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
      {_.map(vConfig, (count, type) => (
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
      {_.map(faceCounts, (count, type) => (
        <li key={type}>
          {count} {polygonNames.get(type)}
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
    <>
      {_.capitalize(symName)}, {group}
      {sub ? <Sub>{sub}</Sub> : undefined}
    </>
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
      <>
        ≈{_.round(p.normalizedVolume(), 3)}s<Sup>{3}</Sup>
      </>
    ),
  },
  {
    name: 'Surface area',
    area: 'sa',
    render: ({ polyhedron: p }) => (
      <>
        ≈{_.round(p.normalizedSurfaceArea(), 3)}s<Sup>{2}</Sup>
      </>
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
