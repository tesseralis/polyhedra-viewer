// @flow strict
import React from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';

const styles = StyleSheet.create({
  // https://a11yproject.com/posts/how-to-hide-content/
  srOnly: {
    position: 'absolute !important',
    height: 1,
    width: 1,
    overflow: 'hidden',
    clip: 'rect(1px, 1px, 1px, 1px)',
  },
});

export default function SrOnly({ children }: *) {
  return <span className={css(styles.srOnly)}>{children}</span>;
}
