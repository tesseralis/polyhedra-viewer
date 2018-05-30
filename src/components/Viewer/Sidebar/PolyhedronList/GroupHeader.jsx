// @flow strict
import React from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';
import { hoeflerText } from 'styles/fonts';

const styles = StyleSheet.create({
  groupHeader: { fontFamily: hoeflerText, fontSize: 24 },
});

export default function GroupHeader({ text, ...props }) {
  return <h2 className={css(styles.groupHeader, props.styles)}>{text}</h2>;
}
