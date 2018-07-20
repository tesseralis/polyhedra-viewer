// @flow strict
import React, { Component } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { Link } from 'react-router-dom';

import { Icon } from 'components/common';
import { escapeName } from 'polyhedra/names';
import { hover } from 'styles/common';
import { media } from 'styles';

const thumbnailSize = 70;

const mobThumbnailSize = 50;

const styles = StyleSheet.create({
  link: {
    ...hover,
    color: 'black',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    margin: 'auto', // center inside a table
    [media.notMobile]: {
      width: thumbnailSize,
      height: thumbnailSize,
    },
    [media.mobile]: {
      width: mobThumbnailSize,
      height: mobThumbnailSize,
    },
  },

  image: {
    [media.notMobile]: {
      height: thumbnailSize + 15,
    },
    [media.mobile]: {
      height: mobThumbnailSize + 15,
    },
  },

  fake: {
    opacity: 0.5,
    filter: 'grayscale(50%)',
  },
});

interface Props {
  name: string;
  isFake: boolean;
}

interface State {
  loaded: boolean;
  error: boolean;
}

export default class PolyhedronLink extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      loaded: false,
      error: false,
    };
  }

  componentDidMount() {
    const img = new Image();
    img.onload = () => {
      this.setState({ loaded: true });
    };
    img.onerror = () => {
      this.setState({ error: true });
    };
    img.src = this.imgSrc();
  }

  render() {
    const { name, isFake } = this.props;
    const { loaded, error } = this.state;
    const escapedName = escapeName(name);
    // TODO image error state
    return (
      <Link
        id={!isFake ? escapedName : undefined}
        to={'/' + escapedName}
        className={css(styles.link, isFake && styles.fake)}
        title={name}
      >
        {loaded ? (
          <img className={css(styles.image)} src={this.imgSrc()} alt={name} />
        ) : error ? (
          <Icon name="alert-circle-outline" size={48} />
        ) : (
          <Icon name="hexagon-outline" size={48} />
        )}
      </Link>
    );
  }

  imgSrc = () => {
    const { name } = this.props;
    const escapedName = escapeName(name);
    return require(`images/${escapedName}.png`);
  };
}
