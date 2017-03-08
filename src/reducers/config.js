import {
  TOGGLE_EDGES,
  TOGGLE_FACES,
  SET_OPACITY,
  RESET,
} from '../constants/ActionTypes'

const initialState  = {
  showEdges: true,
  showFaces: true,
  opacity: 0.9,
}

export default function config(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_EDGES:
      return {
        ...state,
        showEdges: !state.showEdges,
      }
    case TOGGLE_FACES:
      return {
        ...state,
        showFaces: !state.showFaces,
      }
    case SET_OPACITY:
      return {
        ...state,
        opacity: action.opacity
      }
    case RESET:
      return initialState
    default:
      return state
  }
}
