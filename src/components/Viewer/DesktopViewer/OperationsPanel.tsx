import React from 'react';
import { useStyle } from 'styles';

import { ResizeButtons, OpGrid } from '../common';
import { flexColumn } from 'styles/common';

export default function OperationsPanel() {
  const css = useStyle({
    ...flexColumn(),
    height: '100%',
    padding: '20px 10px',
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
