// @flow strict
import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import connect from 'components/connect';
import { Icon, SrOnly } from 'components/common';
import { ApplyOperation, WithPolyhedron } from '../../context';

const styles = StyleSheet.create({
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
      className={css(styles.twistOption)}
    >
      <Icon name={`rotate-${orientation}`} angle={180} size={48} />
      <SrOnly>{orientation}</SrOnly>
    </button>
  );
}

interface Props {
  opName: string;
  onClick(opName: string, twistOpts: *): void;
  disabled: boolean;
}

function TwistOptions({ opName, onClick, disabled }: Props) {
  return (
    <div className={css(styles.twistOptions)}>
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

export default _.flow([
  connect(
    WithPolyhedron,
    { disabled: 'isTransitioning' },
  ),
  connect(
    ApplyOperation,
    { onClick: 'applyOperation' },
  ),
])(TwistOptions);
