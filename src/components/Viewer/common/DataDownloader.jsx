// @flow strict

import React from 'react';
import FileSaver from 'file-saver';

interface Props {
  solid: *;
  name: string;
}

function download(filename, content) {
  const blob = new Blob([content], {
    type: 'text/plain;charset=utf-8',
  });
  FileSaver.saveAs(blob, filename);
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

export default function DataDownloader({ solid, name }: Props) {
  return (
    <p>
      Download solid data:{' '}
      <button
        onClick={() => {
          const combinedData = { ...solid, name };
          download(`${name}.json`, JSON.stringify(combinedData));
        }}
      >
        JSON
      </button>
      <button onClick={() => download(`${name}.obj`, toObj(solid))}>
        .obj
      </button>
    </p>
  );
}
