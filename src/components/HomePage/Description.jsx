// @flow strict

import React, { Component } from 'react';
import Icon from '@mdi/react';
import { mdiMenuDown } from '@mdi/js';

import { makeStyles, fonts } from 'styles';
import { SrOnly } from 'components/common';
import Markdown from './Markdown';

// https://css-tricks.com/text-fade-read-more/
const styles = makeStyles({
  description: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  content: {
    transition: 'height 2s',
    overflowY: 'hidden',
  },

  collapsed: {
    position: 'relative',
  },

  toggle: {
    textAlign: 'center',

    backgroundColor: 'transparent',
    margin: 'auto 0',
    fontSize: 14,
    border: 'none',
    color: 'blue',
    cursor: 'pointer',
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
      <div className={styles('description')}>
        <div className={styles('content', collapsed && 'collapsed')}>
          <Markdown source={collapsed ? brief : content} />
        </div>
        {collapsed && (
          <button className={styles('toggle')} onClick={this.toggle}>
            <Icon path={mdiMenuDown} />
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
