import {
  TOGGLE_EDGES,
  TOGGLE_FACES,
  SET_OPACITY,
  SET_EDGE_WIDTH,
  RESET,
} from '../constants/ActionTypes'

const initialState  = {
  showEdges: true,
  showFaces: true,
  opacity: 0.9,
  edgeWidth: 1,
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
    case SET_EDGE_WIDTH:
      return {
        ...state,
        edgeWidth: action.edgeWidth
      }
    case RESET:
      return initialState
    default:
      return state
  }
}
