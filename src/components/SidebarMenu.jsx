import React, { Component } from 'react'
import { Motion, spring } from 'react-motion'
import { css, StyleSheet } from 'aphrodite/no-important'

import ConditionTransitionMotion from './ConditionTransitionMotion'
import { IconButton, IconLink } from './menuIcons'
import { fixed } from '../styles/common'

// Make everything fixed to the top left so that the animations work properly
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
})

export default class SidebarMenu extends Component {
  state = { show: false }

  toggle() {
    this.setState(({ show }) => ({ show: !show }))
  }

  render() {
    const Sidebar = this.props.sidebar
    const sidebarWidth = 400

    return (
      <div className={css(styles.sidebarMenu)}>
        <Motion style={{ x: spring(this.state.show ? sidebarWidth : 0) }}>
          {({ x }) => (
            <div
              style={{ transform: `translateX(${x}px)` }}
              className={css(styles.menuBar)}
            >
              <IconLink to="/" name="home" />
              <IconButton onClick={() => this.toggle()} name="list" />
            </div>
          )}
        </Motion>
        <ConditionTransitionMotion
          condition={this.state.show}
          willEnter={() => ({ x: -sidebarWidth })}
          willLeave={() => ({ x: spring(-sidebarWidth) })}
          style={{ x: spring(0) }}
        >
          {({ x }) => (
            <div
              className={css(styles.sidebar)}
              style={{ transform: `translateX(${x}px)` }}
            >
              <Sidebar width={sidebarWidth} />
            </div>
          )}
        </ConditionTransitionMotion>
      </div>
    )
  }
}
