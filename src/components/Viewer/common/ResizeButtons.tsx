import React, { ButtonHTMLAttributes } from 'react';
import { useStyle, fontSizes, spacing, dims } from 'styles';

import { TransitionCtx, PolyhedronCtx } from 'components/Viewer/context';

import { Polyhedron } from 'math/polyhedra';
import { andaleMono } from 'styles/fonts';
import { hover } from 'styles/common';

function ResetButton(props: ButtonHTMLAttributes<Element>) {
  const css = useStyle({
    ...hover,
    alignSelf: 'flex-end',
    backgroundColor: 'white',
    border: '1px LightGray solid',
    padding: spacing.s2,
    fontSize: fontSizes.f6,
    fontFamily: andaleMono,
  });
  return <button {...props} {...css()} />;
}

const buttons = [
  {
    name: 'Recenter',
    handler: (polyhedron: Polyhedron) => polyhedron.center(),
  },
  {
    name: 'Resize',
    handler: (polyhedron: Polyhedron) => polyhedron.normalizeToVolume(5),
  },
];

export default function ResizeButtons() {
  const polyhedron = PolyhedronCtx.useState();
  const { setPolyhedron } = PolyhedronCtx.useActions();
  const { isTransitioning } = TransitionCtx.useState();

  const css = useStyle({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: spacing.s2,
  });
  return (
    <div {...css()}>
      {buttons.map(({ name, handler }) => (
        <ResetButton
          key={name}
          disabled={isTransitioning}
          onClick={() => setPolyhedron(handler(polyhedron))}
        >
          {name}
        </ResetButton>
      ))}
    </div>
  );
}
