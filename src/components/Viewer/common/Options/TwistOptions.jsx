// @flow strict
// $FlowFixMe
import React, { useContext } from 'react';
import { makeStyles } from 'styles';
import Icon from '@mdi/react';

import { SrOnly } from 'components/common';
import { useApplyOperation, PolyhedronContext } from '../../context';
import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';

const styles = makeStyles({
  twistOption: {
    border: 'none',
    pointerEvents: 'initial',
    background: 'none',
  },

  twistOptions: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

function TwistOption({ orientation, onClick, disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={styles('twistOption')}
    >
      <Icon
        path={orientation === 'left' ? mdiRotateLeft : mdiRotateRight}
        rotate={180}
        size="48px"
      />
      <SrOnly>{orientation}</SrOnly>
    </button>
  );
}

interface Props {
  opName: string;
}

export default function TwistOptions({ opName }: Props) {
  const { isTransitioning: disabled } = useContext(PolyhedronContext);
  const { applyOperation: onClick } = useApplyOperation();

  return (
    <div className={styles('twistOptions')}>
      <TwistOption
        orientation="left"
        disabled={disabled}
        onClick={() => onClick(opName, { twist: 'left' })}
      />
      <TwistOption
        orientation="right"
        disabled={disabled}
        onClick={() => onClick(opName, { twist: 'right' })}
      />
    </div>
  );
}
