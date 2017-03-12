import React, { Component } from 'react'
import { Motion, spring } from 'react-motion'
import ConditionTransitionMotion from './ConditionTransitionMotion'
import { css, StyleSheet } from 'aphrodite/no-important'

import BigIcon from './BigIcon'

import { fixed, resetButton, bigIcon } from '../styles/common'

const styles = StyleSheet.create({
  configMenu: {
    ...fixed('top', 'right'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },

  toggleButton: { ...resetButton, ...bigIcon },
})

export default class ConfigMenu extends Component {
  state = { show: false }

  // TODO maybe use that state library to make simpler?
  toggle() { this.setState(({ show }) => ({ show: !show })) }

  render() {
    const ConfigForm = this.props.configForm
    const configFormWidth = 270

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
        <ConditionTransitionMotion
          condition={this.state.show}
          willEnter={() => ({ x: configFormWidth, opacity: 0 })}
          willLeave={() => ({ x: spring(configFormWidth), opacity: spring(0) })}
          style={{ x: spring(0), opacity: spring(1)}}
        >
          { ({x, opacity}) =>
            <div style={{ transform: `translateX(${x}px)`, opacity, }}>
              <ConfigForm width={configFormWidth}/>
            </div>
          }
        </ConditionTransitionMotion>
      </div>
    )
  }
}

