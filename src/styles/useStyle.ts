import { useMemo } from 'react';
import { StyleSheet, css, CSSProperties } from 'aphrodite/no-important';

// TODO support for activeClassName
export default function useStyle(styles: CSSProperties, deps: any[] = []) {
  return useMemo(() => {
    const rule = StyleSheet.create({ styles });
    return (prop = 'className') => ({
      [prop]: css(rule.styles),
    });
  }, deps);
}
