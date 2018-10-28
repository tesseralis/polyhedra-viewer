// @flow strict

import _ from 'lodash';
// $FlowFixMe
import React, { useContext, Fragment } from 'react';

import { OperationContext } from 'components/Viewer/context';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

export default function Options() {
  const { operation } = useContext(OperationContext);
  if (!operation) return null;
  return (
    <Fragment>
      {/* TODO determine this within the operation */}
      {_.includes(
        ['shorten', 'snub', 'twist', 'gyroelongate', 'turn'],
        operation.name,
      ) && <TwistOptions />}
      {_.includes(['augment'], operation.name) && <AugmentOptions />}
    </Fragment>
  );
}
