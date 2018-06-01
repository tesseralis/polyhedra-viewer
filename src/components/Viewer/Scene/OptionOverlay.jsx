//@flow

import _ from 'lodash';
import React, { Fragment } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { fixed } from 'styles/common';

import { WithOperation } from 'components/Viewer/OperationContext';
import { unescapeName } from 'polyhedra/names';
import Title from './Title';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

const styles = StyleSheet.create({
  title: {
    ...fixed('bottom', 'right'),
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },
  overlayContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});

function OperationOverlay(props) {
  const { opName, solid, options, applyOperation, setOption } = props;
  return (
    <Fragment>
      <div className={css(styles.title)}>
        <Title name={unescapeName(solid)} />
      </div>
      {_.includes(['shorten', 'snub', 'gyroelongate'], opName) && (
        <div className={css(styles.overlayContainer)}>
          <TwistOptions onClick={twist => applyOperation(opName, { twist })} />
        </div>
      )}
      {_.includes(['augment'], opName) && (
        <div className={css(styles.overlayContainer)}>
          <AugmentOptions
            solid={solid}
            options={options}
            onClickOption={setOption}
          />
        </div>
      )}
    </Fragment>
  );
}
export default (props: *) => (
  <WithOperation>
    {operationProps => (
      <OperationOverlay
        {...props}
        {..._.pick(operationProps, [
          'opName',
          'options',
          'applyOperation',
          'setOption',
        ])}
      />
    )}
  </WithOperation>
);
