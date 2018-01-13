import React, { Component } from 'react'
import { connect } from 'react-redux'
import { css, StyleSheet } from 'aphrodite/no-important'
import { createStructuredSelector } from 'reselect'

import { andaleMono } from '../styles/fonts'
import { transition } from '../styles/common'
import Icon from './Icon'

import { setFilterText } from '../actions'
import { getFilterText } from '../selectors'

const styles = StyleSheet.create({
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
    ...transition('color', 0.35),
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 10,
    color: 'LightGray',
  },

  iconFocus: {
    color: 'Gray',
  },
})

export class SearchBar extends Component {
  state = { isFocused: false }

  setFocus(value) {
    this.setState(() => ({ isFocused: value }))
  }

  render() {
    const { text, setValue } = this.props
    const { isFocused } = this.state
    return (
      <label className={css(styles.searchBar)}>
        <input
          type="text"
          placeholder="Search..."
          value={text}
          onChange={e => setValue(e.target.value)}
          onFocus={() => this.setFocus(true)}
          onBlur={() => this.setFocus(false)}
          className={css(styles.input)}
        />
        <span className={css(styles.icon, isFocused && styles.iconFocus)}>
          <Icon name="search" />
        </span>
      </label>
    )
  }
}

const mapStateToProps = createStructuredSelector({
  text: getFilterText,
})

const mapDispatchToProps = {
  setValue: setFilterText,
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar)
