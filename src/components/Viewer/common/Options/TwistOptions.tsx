import React, { useCallback } from 'react';
import Icon from '@mdi/react';
import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';

import { Twist } from 'types';
import { useStyle, dims } from 'styles';
import { flexRow, square, flexColumn, hover } from 'styles/common';
import { SrOnly } from 'components/common';
import { useApplyOperation, TransitionCtx, OperationCtx } from '../../context';

function TwistOption({ orientation }: { orientation: Twist }) {
  const { isTransitioning } = TransitionCtx.useState();
  const { operation } = OperationCtx.useState();
  const applyOperation = useApplyOperation();
  const handleClick = useCallback(
    () => applyOperation(operation!, { twist: orientation }),
    [orientation, operation, applyOperation],
  );

  const css = useStyle({
    ...flexColumn('center', 'center'),
    ...square(dims.d3),
    ...hover,
    bodrer: '1px LightGray solid',
    pointerEvents: 'initial',
    background: 'none',
  });
  return (
    <button {...css()} disabled={isTransitioning} onClick={handleClick}>
      <Icon
        path={orientation === 'left' ? mdiRotateLeft : mdiRotateRight}
        rotate={180}
        size={dims.d3}
      />
      <SrOnly>{orientation}</SrOnly>
    </button>
  );
}

export default function TwistOptions() {
  const css = useStyle({
    ...flexRow('center', 'space-between'),
    width: '100%',
    height: '100%',
  });
  return (
    <div {...css()}>
      <TwistOption orientation="left" />
      <TwistOption orientation="right" />
    </div>
  );
}
