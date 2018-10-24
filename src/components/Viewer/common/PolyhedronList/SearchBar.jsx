import React, { Component } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';

import { makeStyles } from 'styles';
import { andaleMono } from 'styles/fonts';
import { transition } from 'styles/common';

const styles = makeStyles({
  searchBar: {
    display: 'flex',
    justifyContent: 'left',
    alignItems: 'center',
    padding: 10,
    width: '100%',
    position: 'relative',
  },

  input: {
    ...transition('border-color', 0.35),
    width: '100%',
    height: 36,
    paddingLeft: 30,

    border: '2px LightGray solid',
    borderRadius: 28,

    fontSize: 14,
    fontFamily: andaleMono,

    ':focus': {
      outline: 'none',
      borderColor: 'Gray',
    },
  },

  icon: {
    // TODO This is kinda jank but I'm too lazy to fix it for a not useful feature
    ...transition('fill', 0.35),
    position: 'absolute',
    paddingLeft: 8,
    paddingTop: 2,
    fill: 'LightGray',
  },

  iconFocus: {
    fill: 'Gray',
  },
});

export default class SearchBar extends Component {
  state = { isFocused: false };

  setFocus(value) {
    this.setState(() => ({ isFocused: value }));
  }

  render() {
    const { value, onChange } = this.props;
    const { isFocused } = this.state;
    return (
      <label className={styles('searchBar')}>
        <input
          type="text"
          placeholder="Search..."
          aria-label="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => this.setFocus(true)}
          onBlur={() => this.setFocus(false)}
          className={styles('input')}
        />
        <span className={styles('icon', isFocused && 'iconFocus')}>
          <Icon path={mdiMagnify} size="20px" />
        </span>
      </label>
    );
  }
}
