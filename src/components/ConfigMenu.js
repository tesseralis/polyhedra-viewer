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

const ConfigInput = ({ input, value, setValue }) => {
  const inputProps = getInputProps(input, value)
  const onChange = evt => setValue(getInputValue(input, evt.target))
  return (
    <input type={input.type} onChange={onChange} {...inputProps} />
  )
}

const LabelledInput = ({ input, value, setValue }) => {
  const styles = StyleSheet.create({
    label: {
      width: '100%',
      margin: '8px 0',
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: andaleMono,
    },
  })

  return (
    <label className={css(styles.label)}>
      { input.display }
      <ConfigInput input={input} value={value} setValue={setValue} />
    </label>
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
      width: 270,
      padding: 20,
    },
  })

  const { setInputValue, reset } = actions
  return (
    <form className={css(styles.configMenu)}>
      { configKeys.map(key => {
        const inputProps = {
          input: configOptions[key],
          value: config[key],
          setValue: value => setInputValue(key, value)
        }
        return <LabelledInput {...inputProps} />
      }) }
      <ResetButton reset={reset} />
    </form>
  )
}

export default ConfigMenu
