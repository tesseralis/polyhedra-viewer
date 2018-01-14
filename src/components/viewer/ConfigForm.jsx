import React from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import { configInputs } from 'constants/configOptions'
import { getConfigValues } from 'selectors'
import { reset, setInputValue } from 'actions'
import { hover, transition } from 'styles/common'
import { andaleMono } from 'styles/fonts'

const getInputValue = (input, el) => {
  switch (input.type) {
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
  return <input type={input.type} onChange={onChange} {...inputProps} />
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
      {input.display}
      <ConfigInput input={input} value={value} setValue={setValue} />
    </label>
  )
}

const ResetButton = ({ reset }) => {
  const styles = StyleSheet.create({
    resetButton: {
      ...hover,
      ...transition('all', 0.25),

      width: 120,
      height: 30,
      marginTop: 20,

      background: 'WhiteSmoke',
      border: '2px LightGray solid',
      borderRadius: 2,

      fontFamily: andaleMono,
      fontSize: 14,

      ':focus': {
        outline: 'none',
        borderColor: 'Gray',
      },
    },
  })

  return (
    <button type="button" onClick={reset} className={css(styles.resetButton)}>
      Reset
    </button>
  )
}

const ConfigForm = ({ width, inputValues, setInputValue, reset }) => {
  const styles = StyleSheet.create({
    configMenu: {
      width,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      padding: '0 20px',
    },
  })

  return (
    <form className={css(styles.configMenu)}>
      {configInputs.map(({ key, ...input }) => (
        <LabelledInput
          key={key}
          input={input}
          value={inputValues[key]}
          setValue={value => setInputValue(key, value)}
        />
      ))}
      <ResetButton reset={reset} />
    </form>
  )
}

const mapStateToProps = createStructuredSelector({
  inputValues: getConfigValues,
})

const mapDispatchToProps = {
  setInputValue,
  reset,
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigForm)
