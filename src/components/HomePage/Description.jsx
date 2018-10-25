// @flow strict

import React, { Component } from 'react';
import Icon from '@mdi/react';
import { mdiMenuDown } from '@mdi/js';

import { styled, fonts } from 'styles';
import { SrOnly } from 'components/common';
import Markdown from './Markdown';

const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const Text = styled.div({});

const Toggle = styled.button({
  display: 'flex',
  alignItems: 'center',

  textAlign: 'center',
  backgroundColor: 'transparent',
  margin: 'auto 0',
  fontSize: 14,
  border: 'none',
  color: 'blue',
  fill: 'blue',
  cursor: 'pointer',
  fontFamily: fonts.times,

  ':hover': {
    textDecoration: 'underline',
  },
});

interface Props {
  content: string;
  collapsed: boolean;
  title: string; // used for a11y
}

interface State {
  collapsed: boolean;
}

export default class Description extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      collapsed: props.collapsed,
    };
  }

  render() {
    const { title, content } = this.props;
    const { collapsed } = this.state;

    const brief = content.split('\n\n')[0];

    return (
      <Container>
        <Text>
          <Markdown source={collapsed ? brief : content} />
        </Text>
        {collapsed && (
          <Toggle onClick={this.toggle}>
            <span>
              <Icon path={mdiMenuDown} size="20px" />
            </span>
            {'More'}
            <SrOnly>{`about ${title}`}</SrOnly>
          </Toggle>
        )}
      </Container>
    );
  }

  toggle = () => {
    this.setState(({ collapsed }) => ({ collapsed: !collapsed }));
  };
}
