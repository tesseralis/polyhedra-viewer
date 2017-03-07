import React, { Component } from 'react'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'
import Sidebar from './Sidebar'
import BigIcon from './components/BigIcon'

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 100, // TODO have a list of these

    display: 'flex',
  },

  menuBar: {
    display: 'flex',
    flexDirection: 'column',
  },

  iconWrapper: {
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'black',
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
    return (
      <div className={css(styles.menu)}>
        { isSidebarVisible && <Sidebar /> }
        <div className={css(styles.menuBar)}>
          <Link to="/" className={css(styles.iconWrapper)}>
            <BigIcon symbol='⌂' />
          </Link>
          <button onClick={() => this.toggle()} className={css(styles.iconWrapper)}>
            <BigIcon symbol='☰' />
          </button>
        </div>
      </div>
    )
  }
}

