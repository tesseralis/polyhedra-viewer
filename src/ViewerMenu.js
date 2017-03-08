import React, { Component } from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'

import Sidebar from './components/Sidebar'
import BigIcon from './components/BigIcon'
import ConfigMenu from './ConfigMenu'

const styles = StyleSheet.create({
  viewerMenu: {
    position: 'absolute',
    height: '100%',
    width: '100%',
    zIndex: 100, // TODO have a list of these
    opacity: .9,
    display: 'flex',
    justifyContent: 'space-between',
  },

  leftMenu: {
    display: 'flex',
  },

  rightMenu: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
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
      isSidebarVisible: false,
      isConfigVisible: false,
    }
  }

  toggleSidebar() {
    this.setState(({ isSidebarVisible, ...prevState }, props) => ({
      ...prevState,
      isSidebarVisible: !isSidebarVisible,
    }));
  }

  toggleConfig() {
    this.setState(({ isConfigVisible, ...prevState }, props) => ({
      ...prevState,
      isConfigVisible: !isConfigVisible,
    }));
  }

  render() {
    const { isSidebarVisible, isConfigVisible } = this.state
    const sidebarButtonClass = css(
      styles.iconWrapper,
      isSidebarVisible ? styles.isActive : styles.hover
    )

    return (
      <div className={css(styles.viewerMenu)}>
        <div className={css(styles.leftMenu)}>
          { isSidebarVisible && <Sidebar /> }
          <div className={css(styles.menuBar)}>
            <Link to="/" className={css(styles.iconWrapper, styles.hover)}>
              <BigIcon name='home' />
            </Link>
            <button onClick={() => this.toggleSidebar()} className={sidebarButtonClass}>
              <BigIcon name='list' />
            </button>
          </div>
        </div>
        <div className={css(styles.rightMenu)}>
          <button onClick={() => this.toggleConfig()} className={css(styles.iconWrapper)}>
            <BigIcon name='cog' />
          </button>
          { isConfigVisible && <ConfigMenu /> }
        </div>
      </div>
    )
  }
}

