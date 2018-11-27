import React, { useRef, useCallback } from 'react';
import { SrOnly } from 'components/common';

/**
 * Provides a hidden heading and a function to focus on it.
 */
export default function useHiddenHeading(
  value: string,
): [JSX.Element, () => void] {
  const ref = useRef<HTMLHeadingElement>(null);
  const focusFn = useCallback(
    () => {
      if (ref.current) ref.current.focus();
    },
    [ref.current],
  );
  const node = (
    <SrOnly>
      <h2 tabIndex={0} ref={ref}>
        {value}
      </h2>
    </SrOnly>
  );
  return [node, focusFn];
}
