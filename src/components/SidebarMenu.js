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
  state = { show: false }

  toggle() { this.setState(({ show }) => ({ show: !show })) }


  render() {
    const Sidebar = this.props.sidebar

    // FIXME don't hardcode sidebar width?
    const willEnter = () => ({ x: 0 })
    const willLeave = () => ({ x: spring(0) })
    const sidebarStyle = { key: 'sidebar', style: { x: spring(400) } }
    const motionStyles = this.state.show ? [sidebarStyle] : []

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
        <TransitionMotion
          willEnter={willEnter}
          willLeave={willLeave}
          styles={motionStyles}
        >
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

