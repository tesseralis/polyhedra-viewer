import _ from 'lodash';
import React from 'react';
import { makeStyles } from 'styles';

import { unescapeName } from 'math/polyhedra/names';
import { media, fonts } from 'styles';

const styles = makeStyles({
  title: {
    fontFamily: fonts.andaleMono,
    fontSize: 32,
    fontWeight: 'bold',

    [media.mobile]: {
      fontFamily: fonts.times,
      fontWeight: 'initial',
      fontSize: 18,
      textAlign: 'center',
    },
  },
});

const Title = ({ name }: { name: string }) => {
  return (
    <h1 className={styles('title')}>{_.capitalize(unescapeName(name))}</h1>
  );
};

export default Title;
