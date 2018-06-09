// @flow strict
import React, { Fragment } from 'react';
import _ from 'lodash';

import { WithOperation } from 'components/Viewer/OperationContext';
import connect from 'components/connect';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

function Options({ opName, solid }) {
  return (
    <Fragment>
      {_.includes(
        ['shorten', 'snub', 'twist', 'gyroelongate', 'turn'],
        opName,
      ) && <TwistOptions opName={opName} />}
      {_.includes(['augment'], opName) && <AugmentOptions solid={solid} />}
    </Fragment>
  );
}

export default connect(
  WithOperation,
  ['opName'],
)(Options);
