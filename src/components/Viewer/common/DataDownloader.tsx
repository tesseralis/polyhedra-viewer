import React from 'react';
import Icon from '@mdi/react';

import { makeStyles } from 'styles';
import { SrOnly } from 'components/common';
import { fonts } from 'styles';

import { SolidData } from 'math/polyhedra';
import { hover } from 'styles/common';
import { mdiDownload } from '@mdi/js';

const styles = makeStyles({
  header: {
    fontFamily: fonts.times,
    fontSize: 18,
    marginBottom: 10,
  },
  downloadLink: {
    display: 'inline-flex',
    padding: 10,
    justifyContent: 'center',
    width: 100,

    textDecoration: 'none',
    border: '1px solid LightGrey',
    color: 'black',
    fontFamily: fonts.andaleMono,
    ...hover,

    ':not(:first-child)': {
      marginLeft: 10,
    },
  },
});

function formatDecimal(number: number) {
  return Number.isInteger(number) ? `${number}.0` : number;
}

function vToObj(vertex: number[]) {
  return 'v ' + vertex.map(formatDecimal).join(' ');
}

function fToObj(face: number[]) {
  return 'f ' + face.map(i => i + 1).join(' ');
}

function toObj({ vertices, faces }: SolidData) {
  const vObj = vertices.map(vToObj);
  const fObj = faces.map(fToObj);
  return vObj.concat(fObj).join('\n');
}

const fileFormats = [
  {
    ext: 'json',
    serializer: JSON.stringify,
  },
  {
    ext: 'obj',
    serializer: toObj,
  },
];

interface Props {
  solid: SolidData;
}

export default function DataDownloader({ solid }: Props) {
  const name = solid.name || 'polyhedron';
  return (
    <div>
      <h2 className={styles('header')}>Download model</h2>
      <div>
        {fileFormats.map(({ ext, serializer }) => {
          const filename = `${name}.${ext}`;
          const blob = new Blob([serializer(solid)], {
            type: 'text/plain;charset=utf-8',
          });
          const url = window.URL.createObjectURL(blob);
          return (
            <a
              key={ext}
              download={filename}
              href={url}
              className={styles('downloadLink')}
            >
              <SrOnly>Download as</SrOnly>.{ext}{' '}
              <span>
                <Icon path={mdiDownload} size="18px" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
