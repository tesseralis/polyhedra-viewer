
import React from 'react';
import { makeStyles } from 'styles';
import _ from 'lodash';

import { times } from 'styles/fonts';

const styles = makeStyles({
  header: {
    fontFamily: times,
    fontSize: 17,
    margin: '3px 12px',
  },
});

interface Props {
  name: string;
}

export default function SubgroupHeader({ name }: Props) {
  return <h3 className={styles('header')}>{_.capitalize(name)}</h3>;
}
