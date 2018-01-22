import * as _ from 'lodash'

const SET_MODE = 'SET_MODE'
export const setMode = (mode, relations) => ({
  type: SET_MODE,
  mode,
  relations,
})

const SET_GYRATE = 'SET_GYRATE'
export const setGyrate = gyrate => ({
  type: SET_GYRATE,
  gyrate,
})

const initialState = {
  mode: null,
  gyrate: null,
}

export default function controls(state = initialState, action) {
  switch (action.type) {
    case SET_MODE:
      const newState = { mode: action.mode, gyrate: null }
      if (action.mode === '+') {
        if (_.filter(action.relations, 'gyrate').length > 1) {
          newState.gyrate = 'ortho'
        }
      }
      return { ...state, ...newState }
    case SET_GYRATE:
      return { ...state, gyrate: action.gyrate }
    default:
      return state
  }
}
