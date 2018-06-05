// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { type Twist } from 'types';
import connect from 'components/connect';
import { Icon, SrOnly } from 'components/common';
import { WithPolyhedron } from 'components/Viewer/PolyhedronContext';

const styles = StyleSheet.create({
  twistOption: {
    border: 'none',
    pointerEvents: 'initial',
    margin: 50,
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
  onClick(twist: Twist): void;
  disabled: boolean;
}

function TwistOptions({ onClick, disabled }: Props) {
  return (
    <div className={css(styles.twistOptions)}>
      <TwistOption
        orientation="left"
        disabled={disabled}
        onClick={() => onClick('left')}
      />
      <TwistOption
        orientation="right"
        disabled={disabled}
        onClick={() => onClick('right')}
      />
    </div>
  );
}

export default connect(
  WithPolyhedron,
  { disabled: 'isTransitioning' },
)(TwistOptions);
