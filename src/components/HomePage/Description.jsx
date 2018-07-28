// @flow strict

import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { fonts } from 'styles';
import { Icon, SrOnly } from 'components/common';
import Markdown from './Markdown';

// https://css-tricks.com/text-fade-read-more/
const styles = StyleSheet.create({
  description: {
    position: 'relative',
  },

  content: {
    transition: 'height 2s',
    overflowY: 'hidden',
  },

  collapsed: {
    position: 'relative',
  },

  toggle: {
    width: '100%',
    textAlign: 'center',

    fontSize: 14,
    border: 'none',
    color: 'blue',
    fontFamily: fonts.times,

    ':hover': {
      textDecoration: 'underline',
    },
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
      <div className={css(styles.description)}>
        <div className={css(styles.content, collapsed && styles.collapsed)}>
          <Markdown source={collapsed ? brief : content} />
        </div>
        {collapsed && (
          <button className={css(styles.toggle)} onClick={this.toggle}>
            <Icon name="menu-down" />
            {'More'}
            <SrOnly>{`about ${title}`}</SrOnly>
          </button>
        )}
      </div>
    );
  }

  toggle = () => {
    this.setState(({ collapsed }) => ({ collapsed: !collapsed }));
  };
}
