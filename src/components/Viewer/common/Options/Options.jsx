// @flow strict

import _ from 'lodash';
import React, { Fragment } from 'react';

import { OperationCtx } from 'components/Viewer/context';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

export default function Options() {
  const { operation } = OperationCtx.useState();
  if (!operation) return null;
  if (!operation.optionTypes) return null;
  return (
    <Fragment>
      {_.includes(operation.optionTypes, 'twist') && <TwistOptions />}
      {operation.name === 'augment' && <AugmentOptions />}
    </Fragment>
  );
}
