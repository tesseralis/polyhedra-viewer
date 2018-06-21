// @flow strict
import React from 'react';
import Markdown from 'react-markdown';
import { css, StyleSheet } from 'aphrodite/no-important';

import { fonts } from 'styles';

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 16,
    fontFamily: fonts.hoeflerText,
    color: 'DimGrey',
    lineHeight: 1.5,
    marginBottom: 10,
  },

  link: {
    textDecoration: 'none',
    color: 'MediumBlue',

    ':hover': {
      textDecoration: 'underline',
    },
  },
});

// TODO generate from styles instead of creating new component for each
const Paragraph = props => {
  return <p {...props} className={css(styles.paragraph)} />;
};

const Link = ({ children, href }) => {
  return (
    <a className={css(styles.link)} href={href}>
      {children}
    </a>
  );
};

interface Props {
  source: string;
}

export default ({ source }: Props) => {
  return (
    <Markdown
      source={source}
      renderers={{
        paragraph: Paragraph,
        linkReference: Link,
      }}
    />
  );
};
