import * as types from '../constants/ActionTypes'

export const toggleEdges = () => ({ type: types.TOGGLE_EDGES })
export const toggleFaces = () => ({ type: types.TOGGLE_FACES })
export const setOpacity = opacity => ({ type: types.SET_OPACITY, opacity })
export const setEdgeWidth = edgeWidth => ({ type: types.SET_EDGE_WIDTH, edgeWidth })
export const reset = () => ({ type: types.RESET })
