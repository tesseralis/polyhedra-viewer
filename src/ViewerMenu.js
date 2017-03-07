import React, { Component } from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'
import Sidebar from './Sidebar'
import BigIcon from './components/BigIcon'

const styles = StyleSheet.create({
  viewerMenu: {
    position: 'absolute',
    height: '100%',
    zIndex: 100, // TODO have a list of these
    display: 'flex',
    opacity: .9,
  },

  menuBar: {
    display: 'flex',
    flexDirection: 'column',
  },

  iconWrapper: {
    padding: 10,
    // link restyle
    textDecoration: 'none',
    // button restyle
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    // color
    color: 'Gray',
  },

  hover: {
    ':hover': {
      color: 'DimGray',
    },
  },

  isActive: {
    color: 'DarkSlateGray'
  },
})

export default class ViewerMenu extends Component {
  constructor(props) {
    super(props)
    this.state = {
      isSidebarVisible: false
    }
  }

  toggle() {
    this.setState((prevState, props) => ({
      isSidebarVisible: !prevState.isSidebarVisible
    }));
  }

  render() {
    const { isSidebarVisible } = this.state
    const sidebarButtonClass = css(
      styles.iconWrapper,
      isSidebarVisible ? styles.isActive : styles.hover
    )

    return (
      <div className={css(styles.viewerMenu)}>
        { isSidebarVisible && <Sidebar /> }
        <div className={css(styles.menuBar)}>
          <Link to="/" className={css(styles.iconWrapper, styles.hover)}>
            <BigIcon name='home' />
          </Link>
          <button onClick={() => this.toggle()} className={sidebarButtonClass}>
            <BigIcon name='list' />
          </button>
        </div>
      </div>
    )
  }
}

