//@flow

import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { fixed } from 'styles/common';

import connect from 'components/connect';
import { WithOperation } from 'components/Viewer/OperationContext';
import ApplyOperation from 'components/Viewer/ApplyOperation';
import { unescapeName } from 'polyhedra/names';
import IconLink from 'components/Viewer/IconLink';
import Menu from 'components/Viewer/Menu';
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
    pointerEvents: 'initial',
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
    ...fixed('bottom', 'right'),
  },

  sidebarToggle: {
    pointerEvents: 'initial',
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

function OperationOverlay(props) {
  const { opName, solid, panel, applyOperation } = props;
  return (
    <div className={css(styles.overlay, opName && styles.opFocus)}>
      <div className={css(styles.sidebarToggle)}>
        {panel === 'full' ? (
          <Menu solid={solid} compact />
        ) : (
          <IconLink
            iconName="chevron-left"
            iconOnly
            title="hide menu"
            replace
            to={`/${solid}/${panel === 'full' ? 'related' : 'full'}`}
          />
        )}
      </div>
      <div className={css(styles.title)}>
        <Title name={unescapeName(solid)} />
      </div>
      {_.includes(
        ['shorten', 'snub', 'twist', 'gyroelongate', 'turn'],
        opName,
      ) && (
        <TwistOptions onClick={twist => applyOperation(opName, { twist })} />
      )}
      {_.includes(['augment'], opName) && <AugmentOptions solid={solid} />}
    </div>
  );
}

export default _.flow([
  connect(
    WithOperation,
    ['opName'],
  ),
  connect(
    ApplyOperation,
    ['applyOperation'],
  ),
])(OperationOverlay);
