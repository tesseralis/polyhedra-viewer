import React from 'react';
import { makeStyles } from 'styles';

import { media, fonts } from 'styles';
import { OperationCtx } from 'components/Viewer/context';

const styles = makeStyles({
  prompt: {
    fontSize: 24,
    fontFamily: fonts.andaleMono,
    textAlign: 'center',

    [media.mobile]: {
      fontSize: 20,
    },
  },
});

function getMessage(opName: string) {
  switch (opName) {
    case 'augment':
      return 'Select a face';
    case 'diminish':
    case 'gyrate':
      return 'Select a component';
    case 'sharpen':
    case 'contract':
      return 'Select a type of face';
    default:
      return null;
  }
}

export default function Prompt() {
  const { operation } = OperationCtx.useState();
  if (!operation) return null;
  const message = getMessage(operation.name);
  return message && <div className={styles('prompt')}>{message}</div>;
}
