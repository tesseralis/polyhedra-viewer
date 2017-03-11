import React, { Component } from 'react'
import { TransitionMotion, spring } from 'react-motion'
import { Link } from 'react-router'
import { css, StyleSheet } from 'aphrodite/no-important'

import BigIcon from './BigIcon'
import { resetButton, resetLink } from '../styles/common'

const styles = StyleSheet.create({
  sidebarMenu: {
    position: 'fixed',
    top: 0,
    left: 0,
    // Sidebar
    height: '100%',
    // Horizontally align the sidebar and menu bar
    display: 'flex',
    flexDirection: 'row-reverse',
  },

  menuBar: {
    display: 'flex',
    flexDirection: 'column',
  },

  homeLink: { ...resetLink },

  toggleButton: { ...resetButton },
})

export default class SidebarMenu extends Component {
  //state = { show: false }

  sidebar = { key: 'sidebar', x: 400 }

  state = { items: [] }

  willLeave() {
    return { x: spring(0) }
  }

  willEnter() {
    return { x: 0 }
  }

  //toggle() { this.setState(({ show }) => ({ show: !show })) }
  
  toggle() {
    this.setState(prevState => {
      return prevState.items.length === 0 ? { items: [this.sidebar] } : { items: [] }
    })
  }

  render() {
    const Sidebar = this.props.sidebar

    const motionStyles = this.state.items.map(item => ({
      key: item.key,
      style: { x: spring(item.x) },
    }))
    return (
      <div className={css(styles.sidebarMenu)}>
        <div className={css(styles.menuBar)}>
          <Link to="/" className={css(styles.homeLink)}>
            <BigIcon name='home' />
          </Link>
          <button onClick={() => this.toggle()} className={css(styles.toggleButton)}>
            <BigIcon name='list' />
          </button>
        </div>
        <TransitionMotion willEnter={this.willEnter} willLeave={this.willLeave} styles={motionStyles}>
          { interpolatedStyles =>
            <div>
              { interpolatedStyles.map(config => {
                return (
                  <div
                    key={config.key}
                    style={{width: config.style.x, height: '100%', position: 'relative', overflow: 'auto' }}
                  ><Sidebar /></div>
                )
              })} 
            </div>
          }
        </TransitionMotion>
      </div>
    )
  }
}

