// @flow strict

import React from 'react';
import { makeStyles } from 'styles';

import { Icon, SrOnly } from 'components/common';
import { fonts } from 'styles';

import { hover } from 'styles/common';

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

interface Props {
  solid: *;
  name: string;
}

function formatDecimal(number) {
  return Number.isInteger(number) ? `${number}.0` : number;
}

function vToObj(vertex) {
  return 'v ' + vertex.map(formatDecimal).join(' ');
}

function fToObj(face) {
  return 'f ' + face.map(i => i + 1).join(' ');
}

function toObj({ vertices, faces }) {
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

export default function DataDownloader({ solid, name }: Props) {
  const combinedData = { ...solid, name };
  return (
    <div>
      <h2 className={styles('header')}>Download model</h2>
      <div>
        {fileFormats.map(({ ext, serializer }) => {
          const filename = `${name}.${ext}`;
          const blob = new Blob([serializer(combinedData)], {
            type: 'text/plain;charset=utf-8',
          });
          const url = window.URL.createObjectURL(blob);
          return (
            <a
              download={filename}
              href={url}
              className={styles('downloadLink')}
            >
              <SrOnly>Download as</SrOnly>.{ext} <Icon name="download" />
            </a>
          );
        })}
      </div>
    </div>
  );
}
