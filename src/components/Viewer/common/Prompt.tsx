import React from 'react';
import { useStyle, scales } from 'styles';

import { media, fonts } from 'styles';
import { OperationCtx } from 'components/Viewer/context';

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

  const css = useStyle({
    fontSize: scales.font[3],
    fontFamily: fonts.andaleMono,
    textAlign: 'center',

    [media.mobile]: {
      fontSize: scales.font[4],
    },
  });
  return message && <div {...css()}>{message}</div>;
}
