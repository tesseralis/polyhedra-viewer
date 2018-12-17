import React from 'react';
import { useStyle, spacing } from 'styles';

import { ResizeButtons, OpGrid } from '../common';
import { flexColumn } from 'styles/common';

export default function OperationsPanel() {
  const css = useStyle({
    ...flexColumn(),
    padding: spacing.s3,
    height: '100%',
  });

  const buttonCss = useStyle({ marginTop: 'auto' });

  return (
    <section {...css()}>
      <OpGrid />
      <div {...buttonCss()}>
        <ResizeButtons />
      </div>
    </section>
  );
}
