import _ from 'lodash';
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { unescapeName } from 'polyhedra/names';
import * as fonts from 'styles/fonts';
import * as media from 'styles/media';

const Title = ({ name, ...props }) => {
  const styles = StyleSheet.create({
    title: {
      fontFamily: fonts.andaleMono,
      fontSize: 32,
      fontWeight: 'bold',

      [media.mobile]: {
        fontFamily: fonts.hoeflerText,
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
