import React from 'react';

import { useStyle, fonts, fontSizes, spacing, dims } from 'styles';

import Icon from '@mdi/react';
import { mdiHexagonOutline } from '@mdi/js';

export default function Loading() {
  const css = useStyle({
    width: '100vw',
    height: '100vh',

    display: 'grid',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    gridAutoFlow: 'column',
    gridGap: spacing.s3,
  });

  const text = useStyle({
    fontFamily: fonts.andaleMono,
    fontSize: fontSizes.f3,
  });

  return (
    <div {...css()}>
      <Icon size={dims.d2} path={mdiHexagonOutline} spin />
      <div {...text()}>Loading...</div>
    </div>
  );
}
