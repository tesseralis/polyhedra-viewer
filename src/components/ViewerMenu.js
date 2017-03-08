import React, { Component } from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'

import Sidebar from './Sidebar'
import BigIcon from './BigIcon'
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
    pointerEvents: 'none',
  },

  leftMenu: {
    display: 'flex',
    pointerEvents: 'initial',
  },

  rightMenu: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    pointerEvents: 'initial',
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
  state = {
    showSidebar: false,
    showConfig: false,
  }

  toggleSidebar() {
    this.setState(({ showSidebar, ...prevState }, props) => ({
      ...prevState,
      showSidebar: !showSidebar,
    }));
  }

  toggleConfig() {
    this.setState(({ showConfig, ...prevState }, props) => ({
      ...prevState,
      showConfig: !showConfig,
    }));
  }

  render() {
    const { showSidebar, showConfig } = this.state
    const { config, actions } = this.props
    const sidebarButtonClass = css(
      styles.iconWrapper,
      showSidebar ? styles.isActive : styles.hover
    )

    return (
      <div className={css(styles.viewerMenu)}>
        <div className={css(styles.leftMenu)}>
          { showSidebar && <Sidebar /> }
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
          { showConfig && <ConfigMenu config={config} actions={actions} /> }
        </div>
      </div>
    )
  }
}

