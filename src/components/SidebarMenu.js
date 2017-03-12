import React, { Component } from 'react'
import { Motion, spring } from 'react-motion'
import ConditionTransitionMotion from './ConditionTransitionMotion'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'

import BigIcon from './BigIcon'
import { fixed, resetButton, resetLink, bigIcon } from '../styles/common'

const fixTopLeft = fixed('top', 'left')

const styles = StyleSheet.create({
  sidebarMenu: {
    ...fixTopLeft,
  },

  menuBar: {
    ...fixTopLeft,
    display: 'flex',
    flexDirection: 'column',
  },

  sidebar: {
    ...fixTopLeft,
    height: '100%',
    overflowY: 'scroll',
  },

  homeLink: { ...resetLink, ...bigIcon },

  toggleButton: { ...resetButton, ...bigIcon },
})

export default class SidebarMenu extends Component {
  state = { show: false }

  toggle() { this.setState(({ show }) => ({ show: !show })) }

  render() {
    const Sidebar = this.props.sidebar
    const sidebarWidth = 400

    return (
      <div className={css(styles.sidebarMenu)}>
        <Motion style={{x: spring(this.state.show ? sidebarWidth : 0)}}>
        { ({ x }) =>
          <div style={{transform: `translateX(${x}px)`}} className={css(styles.menuBar)}>
            <Link to="/" className={css(styles.homeLink)}>
              <BigIcon name='home' />
            </Link>
            <button onClick={() => this.toggle()} className={css(styles.toggleButton)}>
              <BigIcon name='list' />
            </button>
          </div>
        }
        </Motion>
        <ConditionTransitionMotion
          condition={this.state.show}
          willEnter={() => ({ x: -sidebarWidth })}
          willLeave={() => ({ x: spring(-sidebarWidth)})}
          style={{ x: spring(0)}}
        >
          { ({x}) => 
            <div className={css(styles.sidebar)} style={{ transform: `translateX(${x}px)` }} >
              <Sidebar width={sidebarWidth}/>
            </div>
          }
        </ConditionTransitionMotion>
      </div>
    )
  }
}

