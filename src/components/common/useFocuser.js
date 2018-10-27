// @flow strict

// $FlowFixMe
import { useRef, useCallback } from 'react';

export default function useFocuser() {
  const ref = useRef(null);
  const focusFn = useCallback(() => ref.current.focus(), [ref.current]);
  return [ref, focusFn];
}
