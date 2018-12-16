import React from 'react';
import { useStyle, spacing } from 'styles';

import { OpGrid, Prompt, Options, ResizeButtons } from '../common';
import { flexColumn } from 'styles/common';

export default function OperationsPanel() {
  const css = useStyle({
    ...flexColumn(),
    height: '100%',
    pointerEvents: 'none',
    padding: spacing.s2,
  });

  const resizeButtons = useStyle({
    pointerEvents: 'initial',
  });

  const prompt = useStyle({
    marginTop: 10,
    marginBottom: 'auto',
  });

  const options = useStyle({
    marginTop: 'auto',
    marginBottom: 10,
  });

  const opGrid = useStyle({
    width: '100%',
    pointerEvents: 'initial',
  });

  // TODO I really wanna create a wrapper component for this...
  return (
    <section {...css()}>
      <div {...resizeButtons()}>
        <ResizeButtons />
      </div>
      <div {...prompt()}>
        <Prompt />
      </div>
      <div {...options()}>
        <Options />
      </div>
      <div {...opGrid()}>
        <OpGrid />
      </div>
    </section>
  );
}
