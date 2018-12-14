import React from 'react';
import { useStyle } from 'styles';

import { ResizeButtons, OpGrid } from '../common';

export default function OperationsPanel() {
  const css = useStyle({
    height: '100%',
    padding: '20px 10px',
    display: 'flex',
    flexDirection: 'column',
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
