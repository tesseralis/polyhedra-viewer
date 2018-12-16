import React from 'react';

import { useStyle, fonts, fontSizes, spacing } from 'styles';
import { absoluteFull, flexRow } from 'styles/common';

import Icon from '@mdi/react';
import { mdiHexagonOutline } from '@mdi/js';

export default function Loading() {
  const css = useStyle({
    ...absoluteFull,

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
      <Icon size="36px" path={mdiHexagonOutline} spin />
      <div {...text()}>Loading...</div>
    </div>
  );
}
