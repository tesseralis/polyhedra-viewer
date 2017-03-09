import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

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
      alignItems: 'flex-start',
    }
  })

  const { setInputValue, reset } = actions
  return (
    <form className={css(styles.configMenu)}>
      { configKeys.map(key => {
        const input = configOptions[key]
        const onChange = evt => setInputValue(key, getInputValue(input, evt.target))
        return (
          <label key={key}>
            { input.display }
            <ConfigInput input={input} value={config[key]} onChange={onChange} />
          </label>
        )
      })}
      <button type="button" onClick={reset}>Reset</button>
    </form>
  )
}

export default ConfigMenu
