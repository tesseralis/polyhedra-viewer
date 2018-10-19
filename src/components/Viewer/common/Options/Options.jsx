// @flow strict
import React, { Fragment } from 'react';
import _ from 'lodash';

import { WithOperation } from 'components/Viewer/context';
import connect from 'components/connect';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

function Options({ opName }) {
  return (
    <Fragment>
      {_.includes(
        ['shorten', 'snub', 'twist', 'gyroelongate', 'turn'],
        opName,
      ) && <TwistOptions opName={opName} />}
      {_.includes(['augment'], opName) && <AugmentOptions />}
    </Fragment>
  );
}

export default connect(
  WithOperation,
  ['opName'],
)(Options);
