import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

import { andaleMono } from '../styles/fonts'
import { configKeys, configOptions } from '../constants/configOptions'

const getInputValue = (input, el) => {
  switch(input.type) {
    case 'checkbox':
      return el.checked
    default:
      return el.value
  }
}

const getInputProps = (input, value) => {
  switch (input.type) {
    case 'checkbox':
      return { checked: value }
    case 'range':
      return {
        ..._.pick(input, ['min', 'max', 'step']),
        value,
      }
    default:
      return { value }
  }
}

const ConfigInput = ({ input, value, onChange }) => {
  const inputProps = getInputProps(input, value)
  return (
    <input type={input.type} onChange={onChange} {...inputProps} />
  )
}

const ConfigMenu = ({ config, actions }) => {
  const styles = StyleSheet.create({
    configMenu: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      padding: 20,
    },

    resetButton: {
      margin: '5px 0',
      background: 'LightGray',
      border: 'none',
      width: 120,
      height: 30,
      fontFamily: andaleMono,
    },

    label: {
      width: '100%',
      display: 'flex',
      justifyContent: 'space-between',
      margin: '5px 0',
    },

    labelText: {
      fontFamily: andaleMono,
      paddingRight: 5,
    },

  })

  const { setInputValue, reset } = actions
  return (
    <form className={css(styles.configMenu)}>
      <button type="button" onClick={reset} className={css(styles.resetButton)}>Reset</button>
      { configKeys.map(key => {
        const input = configOptions[key]
        const onChange = evt => setInputValue(key, getInputValue(input, evt.target))
        return (
          <label key={key} className={css(styles.label)}>
            <span className={css(styles.labelText)}>{ input.display }</span>
            <ConfigInput input={input} value={config[key]} onChange={onChange} />
          </label>
        )
      })}
    </form>
  )
}

export default ConfigMenu
