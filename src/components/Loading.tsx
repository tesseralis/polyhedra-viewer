import React from 'react';

import { useStyle, fonts } from 'styles';
import { absoluteFull } from 'styles/common';

import Icon from '@mdi/react';
import { mdiHexagonOutline } from '@mdi/js';

export default function Loading() {
  const css = useStyle({
    ...absoluteFull,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const text = useStyle({
    marginLeft: 10,
    fontFamily: fonts.andaleMono,
    fontSize: 28,
  });

  return (
    <div {...css()}>
      <Icon size="36px" path={mdiHexagonOutline} spin />
      <div {...text()}>Loading...</div>
    </div>
  );
}
