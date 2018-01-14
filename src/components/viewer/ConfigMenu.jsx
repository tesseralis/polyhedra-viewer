import React, { Component } from 'react'
import { Motion, spring } from 'react-motion'
import { css, StyleSheet } from 'aphrodite/no-important'

import { fixed } from 'styles/common'

import ConditionTransitionMotion from './ConditionTransitionMotion'
import ConfigForm from './ConfigForm'
import { IconButton } from './menuIcons'

const styles = StyleSheet.create({
  configMenu: {
    ...fixed('top', 'right'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
})

export default class ConfigMenu extends Component {
  state = { show: false }

  toggle() {
    this.setState(({ show }) => ({ show: !show }))
  }

  render() {
    const configFormWidth = 270

    return (
      <div className={css(styles.configMenu)}>
        <Motion style={{ theta: spring(this.state.show ? 180 : 0) }}>
          {({ theta }) => (
            <div style={{ transform: `rotate(${theta}deg)` }}>
              <IconButton onClick={() => this.toggle()} name="cog" />
            </div>
          )}
        </Motion>
        <ConditionTransitionMotion
          condition={this.state.show}
          willEnter={() => ({ x: configFormWidth, opacity: 0 })}
          willLeave={() => ({ x: spring(configFormWidth), opacity: spring(0) })}
          style={{ x: spring(0), opacity: spring(1) }}
        >
          {({ x, opacity }) => (
            <div style={{ transform: `translateX(${x}px)`, opacity }}>
              <ConfigForm width={configFormWidth} />
            </div>
          )}
        </ConditionTransitionMotion>
      </div>
    )
  }
}
