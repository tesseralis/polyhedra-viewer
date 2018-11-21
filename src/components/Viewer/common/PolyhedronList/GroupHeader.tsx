
import React from 'react';

import { makeStyles, fonts } from 'styles';

const styles = makeStyles({
  groupHeader: {
    fontFamily: fonts.times,
    fontSize: 24,
    margin: '5px 12px',
  },
});

interface Props {
  text: string;
}

export default function GroupHeader({ text }: Props) {
  return <h2 className={styles('groupHeader')}>{text}</h2>;
}
