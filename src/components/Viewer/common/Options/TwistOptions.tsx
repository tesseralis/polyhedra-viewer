import React, { useCallback } from 'react';
import Icon from '@mdi/react';

import { Twist } from 'types';
import { useStyle } from 'styles';
import { SrOnly } from 'components/common';
import { useApplyOperation, TransitionCtx, OperationCtx } from '../../context';
import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';

function TwistOption({ orientation }: { orientation: Twist }) {
  const { isTransitioning } = TransitionCtx.useState();
  const { operation } = OperationCtx.useState();
  const applyOperation = useApplyOperation();
  const handleClick = useCallback(
    () => applyOperation(operation!, { twist: orientation }),
    [orientation, operation, applyOperation],
  );

  const css = useStyle({
    border: 'none',
    pointerEvents: 'initial',
    background: 'none',
  });
  return (
    <button {...css()} disabled={isTransitioning} onClick={handleClick}>
      <Icon
        path={orientation === 'left' ? mdiRotateLeft : mdiRotateRight}
        rotate={180}
        size="48px"
      />
      <SrOnly>{orientation}</SrOnly>
    </button>
  );
}

export default function TwistOptions() {
  const css = useStyle({
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  });
  return (
    <div {...css()}>
      <TwistOption orientation="left" />
      <TwistOption orientation="right" />
    </div>
  );
}
