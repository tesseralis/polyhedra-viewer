import _ from 'lodash'

import { configOptions } from '../constants/configOptions'
import {
  SET_INPUT_VALUE,
  RESET,
} from '../constants/ActionTypes'

const initialState = _.mapValues(configOptions, 'default')

export default function config(state = initialState, action) {
  switch (action.type) {
    case SET_INPUT_VALUE:
      return _.set({...state}, action.key, action.value)
    case RESET:
      return initialState
    default:
      return state
  }
}
