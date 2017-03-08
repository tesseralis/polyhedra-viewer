import {
  TOGGLE_EDGES,
  TOGGLE_FACES,
  SET_OPACITY,
  RESET,
} from '../constants/ActionTypes'

import _ from 'lodash'
import { toggle } from '../util'

const initialState  = {
  showEdges: true,
  showFaces: true,
  opacity: 0.9,
}

export default function config(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_EDGES:
      return _.update({...state}, 'showEdges', toggle)
    case TOGGLE_FACES:
      return _.update({...state}, 'showFaces', toggle)
    case SET_OPACITY:
      return _.set({...state}, 'opacity', action.opacity)
    case RESET:
      return initialState
    default:
      return state
  }
}
