import React, { Component } from 'react'
import { Motion, TransitionMotion, spring } from 'react-motion'
import { css, StyleSheet } from 'aphrodite/no-important'

import BigIcon from './BigIcon'

import { resetButton } from '../styles/common'

const styles = StyleSheet.create({
  configMenu: {
    position: 'fixed',
    top: '0',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    pointerEvents: 'initial',
  },

  toggleButton: { ...resetButton },
})

export default class ConfigMenu extends Component {
  state = { show: false }

  // TODO maybe use that state library to make simpler?
  toggle() { this.setState(({ show }) => ({ show: !show })) }

  render() {
    const ConfigForm = this.props.configForm

    const willEnter = () => ({ x: 270, opacity: 0 }) 
    const willLeave = () => ({ x: spring(270), opacity: spring(0) })
    const configStyle = { key: 'config', style: { x: spring(0), opacity: spring(1) } }
    const motionStyles = this.state.show ? [configStyle] : []

    return (
      <div className={css(styles.configMenu)}>
        <button onClick={() => this.toggle()} className={css(styles.toggleButton)}>
          <Motion style={{ theta: spring(this.state.show ? 180 : 0) }}>
          {({ theta }) =>
            <div style={{ transform: `rotate(${theta}deg)` }}>
              <BigIcon name='cog' />
            </div>
          }
          </Motion>
        </button>
        <TransitionMotion
          willEnter={willEnter}
          willLeave={willLeave}
          styles={motionStyles}
        >
          { interpolatedStyles => <div>
            { interpolatedStyles.map(config => {
              return (
                <div
                  key={config.key}
                  style={{
                    transform: `translateX(${config.style.x}px)`,
                    opacity: config.style.opacity,
                  }}
                ><ConfigForm /></div>
              )
            }) }
          </div> }
        </TransitionMotion>
      </div>
    )
  }
}

