import React, { Component } from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import BigIcon from './BigIcon'
import ConfigForm from './ConfigForm'

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
    const { config, actions } = this.props
    return (
      <div className={css(styles.configMenu)}>
        <button onClick={() => this.toggle()} className={css(styles.toggleButton)}>
          <BigIcon name='cog' />
        </button>
        { this.state.show && <ConfigForm configValues={config} {...actions} /> }
      </div>
    )
  }
}

