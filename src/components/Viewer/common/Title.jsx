import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { unescapeName } from 'polyhedra/names';
import { media, fonts } from 'styles';

const Title = ({ name, ...props }) => {
  const styles = StyleSheet.create({
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

  return (
    <h1 className={css(styles.title, props.styles)}>
      {_.capitalize(unescapeName(name))}
    </h1>
  );
};

export default Title;
