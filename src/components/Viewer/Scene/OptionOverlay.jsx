//@flow

import _ from 'lodash';
import React, { Fragment } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { fixed } from 'styles/common';
import { andaleMono } from 'styles/fonts';

import { WithOperation } from 'components/Viewer/OperationContext';
import { unescapeName } from 'polyhedra/names';
import Title from './Title';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

const operationDescriptions = {
  augment: 'Click on a face to add a pyramid or cupola.',
  diminish: 'Click on a pyramid or cupola to remove it.',
  gyrate: 'Click on a set of faces to gyrate them.',
  cumulate: 'Click on a set of faces to cumulate them.',
  contract: 'Click on a set of faces to contract them.',
};

const styles = StyleSheet.create({
  description: {
    ...fixed('top', 'right'),
    padding: 36,
    fontSize: 24,
    fontFamily: andaleMono,
    textAlign: 'right',
  },
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
      {_.has(operationDescriptions, opName) && (
        <div className={css(styles.description)}>
          {_.get(operationDescriptions, opName)}
        </div>
      )}
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
