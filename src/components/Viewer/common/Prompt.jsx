// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { media, fonts } from 'styles';
import { WithOperation } from 'components/Viewer/context';
import connect from 'components/connect';

const styles = StyleSheet.create({
  prompt: {
    fontSize: 24,
    fontFamily: fonts.andaleMono,
    textAlign: 'center',

    [media.mobile]: {
      fontSize: 20,
    },
  },
});

function getMessage(opName) {
  switch (opName) {
    case 'augment':
      return 'Select a face';
    case 'diminish':
    case 'gyrate':
      return 'Select a component';
    case 'cumulate':
    case 'contract':
      return 'Select a type of face';
    default:
      return null;
  }
}

function Prompt({ opName }) {
  const message = getMessage(opName);
  return message && <div className={css(styles.prompt)}>{message}</div>;
}

export default connect(
  WithOperation,
  ['opName'],
)(Prompt);
