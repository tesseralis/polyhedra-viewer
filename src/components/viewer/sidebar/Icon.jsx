// @flow strict
import React from 'react';
import _ from 'lodash';
import 'mdi/css/materialdesignicons.min.css';

interface Props {
  name: string;
  size?: 18 | 24 | 36 | 48;
  angle?: 45 | 90 | 135 | 180 | 225 | 270 | 315;
}

const Icon = ({ name, size, angle }: Props) => {
  const classes = _.compact([
    'mdi',
    `mdi-${name}`,
    size && `mdi-${size}px`,
    angle && `mdi-rotate-${angle}`,
  ]);

  return <i className={classes.join(' ')} aria-hidden="true" />;
};

export default Icon;
