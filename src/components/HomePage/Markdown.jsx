// @flow strict
import React from 'react';
import Markdown from 'react-markdown';

import { ExternalLink } from 'components/common';
import { styled, fonts } from 'styles';

const listIndent = 20;

const renderers = {
  paragraph: styled.p({
    fontSize: 16,
    fontFamily: fonts.times,
    color: 'DimGrey',
    lineHeight: 1.5,
    ':not(:last-child)': {
      marginBottom: 10,
    },
  }),
  linkReference: styled(ExternalLink)({
    textDecoration: 'none',
    color: 'MediumBlue',

    ':hover': {
      textDecoration: 'underline',
    },
  }),
  // FIXME test warnings bc of passed props
  list: styled.ul({
    listStyle: 'disc inside',
    margin: '0 20px',
    marginBottom: 10,
  }),
  listItem: styled.li({
    fontSize: 16,
    fontFamily: fonts.times,
    color: 'DimGrey',
    lineHeight: 1.5,
    textIndent: -listIndent,
    paddingLeft: listIndent,
  }),
  emphasis: styled.em({ fontStyle: 'italic' }),
  strong: styled.strong({ fontWeight: 'bold' }),
};

interface Props {
  source: string;
}

export default ({ source }: Props) => {
  return <Markdown source={source} renderers={renderers} />;
};
