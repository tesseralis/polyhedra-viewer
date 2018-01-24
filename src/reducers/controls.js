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

const SET_AUGMENTEE = 'SET_AUGMENTEE'
export const setAugmentee = augmentee => ({
  type: SET_AUGMENTEE,
  augmentee,
})

const initialState = {
  mode: null,
  gyrate: null,
  augmentee: null,
}

export default function controls(state = initialState, action) {
  switch (action.type) {
    case SET_MODE:
      const newState = { mode: action.mode, gyrate: null, augmentee: null }
      // FIXME we need to redo this when moving to a different polyhedron
      if (action.mode === '+') {
        // FIXME I don't like this, not one bit!
        if (_.filter(action.relations, 'gyrate').length > 1) {
          newState.gyrate = 'ortho'
        }
        if (_.filter(action.relations, 'using').length > 1) {
          newState.augmentee = action.relations[0].using
        }
      }
      return { ...state, ...newState }
    case SET_GYRATE:
      return { ...state, gyrate: action.gyrate }
    case SET_AUGMENTEE:
      return { ...state, augmentee: action.augmentee }
    default:
      return state
  }
}
