import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

import commonStyles from '../styles/common'
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

const ResetButton = ({ reset }) => {
  const styles = StyleSheet.create({
    resetButton: {
      width: 120,
      height: 30,
      marginTop: 10,

      background: 'WhiteSmoke',
      border: '1px Gray solid',
      borderRadius: 2,

      fontFamily: andaleMono,
      fontSize: 14,
    },
  })

  return (
    <button
      type="button"
      onClick={reset}
      className={css(styles.resetButton, commonStyles.hover)}
    >Reset</button>
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
      <ResetButton reset={reset} />
    </form>
  )
}

export default ConfigMenu
