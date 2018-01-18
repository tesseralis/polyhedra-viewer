import _ from 'lodash'

import { configOptions } from '../constants/configOptions'

const SET_INPUT_VALUE = 'SET_INPUT_VALUE'
export const setInputValue = (key, value) => ({
  type: SET_INPUT_VALUE,
  key,
  value,
})

const RESET = 'RESET'
export const reset = () => ({ type: RESET })

const initialState = _.mapValues(configOptions, 'default')

export default function config(state = initialState, action) {
  switch (action.type) {
    case SET_INPUT_VALUE:
      return _.set({ ...state }, action.key, action.value)
    case RESET:
      return initialState
    default:
      return state
  }
}
