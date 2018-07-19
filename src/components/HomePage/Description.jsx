// @flow strict

import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import { fonts } from 'styles';
import { Icon } from 'components/common';
import Markdown from './Markdown';

// https://css-tricks.com/text-fade-read-more/
const styles = StyleSheet.create({
  description: {
    position: 'relative',
  },
  content: {
    transition: 'max-height 2s',
    maxHeight: 1000,
    overflowY: 'hidden',

    ':before': {
      content: "''",
      width: '100%',
      position: 'absolute',
      left: 0,
      bottom: 0,
      padding: '30px 0',
      background: 'linear-gradient(transparent 150px, white)',
      backgroundImage: 'linear-gradient(to bottom, transparent, white)',

      transition: 'opacity .3s',
      opacity: 0,
    },
  },

  collapsed: {
    position: 'relative',
    maxHeight: 100,

    ':before': {
      opacity: 1,
    },
  },

  toggle: {
    width: '100%',
    textAlign: 'center',
    position: 'absolute',
    bottom: 0,

    fontSize: 14,
    border: 'none',
    color: 'blue',
    fontFamily: fonts.hoeflerText,

    ':hover': {
      textDecoration: 'underline',
    },
  },
});

interface Props {
  content: string;
  collapsed: boolean;
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
    const { content } = this.props;
    const { collapsed } = this.state;
    return (
      <div className={css(styles.description)}>
        <div className={css(styles.content, collapsed && styles.collapsed)}>
          <Markdown source={content} />
        </div>
        {collapsed && (
          <button className={css(styles.toggle)} onClick={this.toggle}>
            <Icon name="menu-down" />
            {'More...'}
          </button>
        )}
      </div>
    );
  }

  toggle = () => {
    this.setState(({ collapsed }) => ({ collapsed: !collapsed }));
  };
}
