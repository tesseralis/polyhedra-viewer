import React, { HTMLAttributes, ReactType } from 'react';
import Markdown from 'react-markdown';
import { CSSProperties } from 'aphrodite';

import { ExternalLink } from 'components/common';
import { useStyle, fonts, fontSizes, spacing } from 'styles';

function styled(el: ReactType, styles: CSSProperties) {
  const El = el;
  return (props: any) => {
    const css = useStyle(styles);
    return <El {...props} {...css()} />;
  };
}

const List = styled('ul', {
  listStyle: 'disc inside',
  margin: '0 20px',
  marginBottom: 10,
});

const listIndent = spacing.s3;
const ListItem = styled('li', {
  fontSize: fontSizes.f5,
  fontFamily: fonts.times,
  color: 'DimGrey',
  lineHeight: 1.5,
  textIndent: -listIndent,
  paddingLeft: listIndent,
});

interface RenderProps extends HTMLAttributes<any> {
  ordered: boolean;
  tight: boolean;
}

const renderers = {
  paragraph: styled('p', {
    fontSize: fontSizes.f5,
    fontFamily: fonts.times,
    color: 'DimGrey',
    lineHeight: 1.5,
    ':not(:last-child)': {
      marginBottom: 10,
    },
  }),
  linkReference: styled(ExternalLink, {
    textDecoration: 'none',
    color: 'MediumBlue',

    ':hover': {
      textDecoration: 'underline',
    },
  }),
  // Don't pass in the custom react-markdown props
  list: ({ ordered, tight, ...props }: RenderProps) => <List {...props} />,
  listItem: ({ ordered, tight, ...props }: RenderProps) => (
    <ListItem {...props} />
  ),
  emphasis: styled('em', { fontStyle: 'italic' }),
  strong: styled('strong', { fontWeight: 'bold' }),
};

interface Props {
  source: string;
}

export default ({ source }: Props) => {
  return <Markdown source={source} renderers={renderers} />;
};
