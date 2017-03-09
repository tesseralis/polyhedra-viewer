import _ from 'lodash'

import { mapObject } from '../util'
import polygons from '../constants/polygons'
import { configOptions, getColorInputKey } from '../constants/configOptions'
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

const getColors = state => mapObject(polygons, n => state[getColorInputKey(n)])
export const getPolyhedronConfig = state => ({ ...state, colors: getColors(state) })
export const getMenuConfig = _.identity
