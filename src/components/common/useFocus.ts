import { MutableRefObject, useRef, useCallback } from 'react';

export default function useFocus(): [MutableRefObject<any>, () => void] {
  const ref = useRef<any>(null);
  const focusFn = useCallback(
    () => {
      if (ref.current) ref.current.focus();
    },
    [ref.current],
  );
  return [ref, focusFn];
}
