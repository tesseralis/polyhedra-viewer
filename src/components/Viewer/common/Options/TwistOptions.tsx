import React, { useCallback } from 'react';
import Icon from '@mdi/react';

import { Twist } from 'types';
import { styled } from 'styles';
import { SrOnly } from 'components/common';
import { useApplyOperation, TransitionCtx, OperationCtx } from '../../context';
import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';

const TwistButton = styled.button({
  border: 'none',
  pointerEvents: 'initial',
  background: 'none',
});

function TwistOption({ orientation }: { orientation: Twist }) {
  const { isTransitioning } = TransitionCtx.useState();
  const { operation } = OperationCtx.useState();
  const applyOperation = useApplyOperation();

  const handleClick = useCallback(
    () => applyOperation(operation!, { twist: orientation }),
    [orientation, operation, applyOperation],
  );
  return (
    <TwistButton disabled={isTransitioning} onClick={handleClick}>
      <Icon
        path={orientation === 'left' ? mdiRotateLeft : mdiRotateRight}
        rotate={180}
        size="48px"
      />
      <SrOnly>{orientation}</SrOnly>
    </TwistButton>
  );
}

const Container = styled.div({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export default function TwistOptions() {
  return (
    <Container>
      <TwistOption orientation="left" />
      <TwistOption orientation="right" />
    </Container>
  );
}
