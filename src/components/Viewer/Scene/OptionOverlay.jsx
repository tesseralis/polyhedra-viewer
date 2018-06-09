//@flow

import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { absolute } from 'styles/common';
import connect from 'components/connect';
import { WithOperation } from 'components/Viewer/OperationContext';
import { unescapeName } from 'polyhedra/names';
import IconLink from 'components/Viewer/IconLink';
import Title from './Title';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },

  opFocus: {
    // border: '2px solid DarkSlateGray',
  },

  title: {
    ...absolute('bottom', 'right'),
    pointerEvents: 'initial',
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },

  homeLink: {
    pointerEvents: 'initial',
    ...absolute('top', 'left'),
  },
});

function OperationOverlay({ opName, solid }) {
  return (
    <div className={css(styles.overlay, opName && styles.opFocus)}>
      <div className={css(styles.homeLink)}>
        <IconLink iconName="periodic-table" title="Table" replace to="/" />
      </div>
      <div className={css(styles.title)}>
        <Title name={unescapeName(solid)} />
      </div>
      {_.includes(
        ['shorten', 'snub', 'twist', 'gyroelongate', 'turn'],
        opName,
      ) && <TwistOptions opName={opName} />}
      {_.includes(['augment'], opName) && <AugmentOptions solid={solid} />}
    </div>
  );
}

export default connect(
  WithOperation,
  ['opName'],
)(OperationOverlay);
