//@flow

import React from 'react';
import { useStyle, spacing } from 'styles';

import { absolute, absoluteFull, paddingHoriz } from 'styles/common';
import { BackLink, Title, Options, Prompt } from '../common';

interface Props {
  solid: string;
}

// FIXME replace all the padding/absolute values with Grid
export default function Overlay({ solid }: Props) {
  const css = useStyle({
    ...absoluteFull,
    pointerEvents: 'none',
  });

  const title = useStyle({
    ...absolute('bottom', 'left'),
    pointerEvents: 'initial',
    padding: spacing.s4,
  });

  const homeLink = useStyle({
    ...absolute('top', 'left'),
    pointerEvents: 'initial',
    paddingLeft: spacing.s2,
  });

  const options = useStyle({
    ...paddingHoriz(spacing.s4),
    height: '100%',
  });

  const prompt = useStyle({
    paddingTop: spacing.s3,
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
  });

  return (
    <div {...css()}>
      <div {...homeLink()}>
        <BackLink solid={solid} />
      </div>
      <div {...title()}>
        <Title name={solid} />
      </div>
      <div {...prompt()}>
        <Prompt />
      </div>
      <div {...options()}>
        <Options />
      </div>
    </div>
  );
}
