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

const ConfigContext = React.createContext(null)

const ConfigSetter = React.createContext(_.noop)

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
    // FIXME don't call this function every time
    return (
      <ConfigContext.Provider value={getPolyhedronConfig(this.state)}>
        <ConfigSetter.Provider value={this.setInputValue}>
          {children}
        </ConfigSetter.Provider>
      </ConfigContext.Provider>
    )
  }

  setInputValue = (key, value) => {
    if (key === null) {
      this.setState(initialState)
    }
    this.setState({ [key]: value })
  }
}

export const WithConfig = ConfigContext.Consumer

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
      {inputValues => (
        <ConfigSetter.Consumer>
          {setInputValue => (
            <form className={css(styles.configMenu)}>
              {configInputs.map(({ key, ...input }) => (
                <LabelledInput
                  key={key}
                  input={input}
                  value={inputValues[key]}
                  setValue={value => setInputValue(key, value)}
                />
              ))}
              <ResetButton reset={() => setInputValue(null)} />
            </form>
          )}
        </ConfigSetter.Consumer>
      )}
    </ConfigContext.Consumer>
  )
}
