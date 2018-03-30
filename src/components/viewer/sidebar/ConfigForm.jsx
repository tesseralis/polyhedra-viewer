import React, { Component } from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import _ from 'lodash'

import { mapObject } from 'util.js'
import polygons from 'constants/polygons'
import {
  configOptions,
  configInputs,
  getColorInputKey,
} from 'constants/configOptions'
import { hover, transition } from 'styles/common'
import { andaleMono } from 'styles/fonts'

const ConfigContext = React.createContext({
  inputValues: null,
  setInputValue: _.noop,
  reset: _.noop,
})

const initialState = _.mapValues(configOptions, 'default')
const getColors = config =>
  mapObject(polygons, n => [n, config[getColorInputKey(n)]])

const getPolyhedronConfig = config => ({ ...config, colors: getColors(config) })

export class ConfigProvider extends Component {
  constructor(props) {
    super(props)
    this.state = initialState
  }

  render() {
    const { children } = this.props
    const configValue = {
      inputValues: getPolyhedronConfig(this.state),
      setInputValue: this.setInputValue,
      reset: this.reset,
    }
    return (
      <ConfigContext.Provider value={configValue}>
        {children}
      </ConfigContext.Provider>
    )
  }

  setInputValue = (key, value) => {
    console.log('setting input value')
    this.setState({ [key]: value })
  }

  reset = () => {
    this.setState(initialState)
  }
}

export function WithConfig({ children }) {
  return (
    <ConfigContext.Consumer>
      {({ inputValues }) => children(inputValues)}
    </ConfigContext.Consumer>
  )
}

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

export default ({ width, inputValues, setInputValue, reset }) => {
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
    <ConfigContext.Consumer>
      {({ inputValues, setInputValue, reset }) => (
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
      )}
    </ConfigContext.Consumer>
  )
}
