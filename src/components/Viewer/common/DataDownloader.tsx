import React from 'react';
import Icon from '@mdi/react';

import { useStyle, fontSizes, spacing } from 'styles';
import { SrOnly } from 'components/common';
import { fonts } from 'styles';

import { SolidData } from 'math/polyhedra';
import { hover } from 'styles/common';
import { mdiDownload } from '@mdi/js';

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

function DownloadLink({
  ext,
  serializer,
  solid,
}: typeof fileFormats[0] & Props) {
  const filename = `${solid.name}.${ext}`;
  const blob = new Blob([serializer(solid)], {
    type: 'text/plain;charset=utf-8',
  });
  const url = window.URL.createObjectURL(blob);

  const css = useStyle({
    display: 'inline-flex',
    justifyContent: 'center',
    padding: spacing.s2,
    width: 100,

    textDecoration: 'none',
    border: '1px solid LightGrey',
    color: 'black',
    fontFamily: fonts.andaleMono,
    ...hover,

    ':not(:first-child)': {
      marginLeft: 10,
    },
  });

  return (
    <a {...css()} key={ext} download={filename} href={url}>
      <SrOnly>Download as</SrOnly>.{ext}{' '}
      <span>
        <Icon path={mdiDownload} size="18px" />
      </span>
    </a>
  );
}

export default function DataDownloader({ solid }: Props) {
  const heading = useStyle({
    fontFamily: fonts.times,
    fontSize: fontSizes.f5,
    marginBottom: 10,
  });
  return (
    <div>
      <h2 {...heading()}>Download model</h2>
      <div>
        {fileFormats.map(format => (
          <DownloadLink {...format} solid={solid} />
        ))}
      </div>
    </div>
  );
}
