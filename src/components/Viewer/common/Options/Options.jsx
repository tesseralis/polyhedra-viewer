// @flow strict

import _ from 'lodash';
// $FlowFixMe
import React, { useContext, Fragment } from 'react';

import { OperationContext } from 'components/Viewer/context';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

export default function Options() {
  const { opName } = useContext(OperationContext);
  return (
    <Fragment>
      {/* TODO determine this within the operation */}
      {_.includes(
        ['shorten', 'snub', 'twist', 'gyroelongate', 'turn'],
        opName,
      ) && <TwistOptions />}
      {_.includes(['augment'], opName) && <AugmentOptions />}
    </Fragment>
  );
}
