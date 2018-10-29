// @flow strict

import _ from 'lodash';
import React, { Fragment } from 'react';

import { OperationModel } from 'components/Viewer/context';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

export default function Options() {
  const { operation } = OperationModel.useState();
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
