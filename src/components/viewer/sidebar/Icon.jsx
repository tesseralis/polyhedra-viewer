// @flow strict
import React from 'react';
import _ from 'lodash';
import 'mdi/css/materialdesignicons.min.css';

interface Props {
  name: string;
  size?: 18 | 24 | 36 | 48;
}

const Icon = ({ name, size }: Props) => {
  const classes = _.compact(['mdi', `mdi-${name}`, size && `mdi-${size}px`]);

  return <i className={classes.join(' ')} aria-hidden="true" />;
};

export default Icon;
