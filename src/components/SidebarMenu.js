import React, { Component } from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'

import BigIcon from './BigIcon'
import { resetButton, resetLink } from '../styles/common'

const styles = StyleSheet.create({
  viewerMenu: {
    position: 'fixed',
    top: 0,
    left: 0,
    // Sidebar
    height: '100%',
    // Horizontally align the sidebar and menu bar
    display: 'flex',
  },

  menuBar: {
    display: 'flex',
    flexDirection: 'column',
  },

  homeLink: { ...resetLink },

  toggleButton: { ...resetButton },
})

export default class SidebarMenu extends Component {
  state = { show: false }

  toggle() { this.setState(({ show }) => ({ show: !show })) }

  render() {
    const Sidebar = this.props.sidebar
    return (
      <div className={css(styles.viewerMenu)}>
        { this.state.show && <Sidebar /> }
        <div className={css(styles.menuBar)}>
          <Link to="/" className={css(styles.homeLink)}>
            <BigIcon name='home' />
          </Link>
          <button onClick={() => this.toggle()} className={css(styles.toggleButton)}>
            <BigIcon name='list' />
          </button>
        </div>
      </div>
    )
  }
}

