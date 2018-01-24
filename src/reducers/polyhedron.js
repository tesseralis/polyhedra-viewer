import { isValidSolid } from 'constants/polyhedra'
import Polyhedron from 'math/Polyhedron'
import {
  // getElongated,
  // getGyroElongated,
  augment,
  diminish,
  gyrate,
} from 'math/operations'

const SET_POLYHEDRON = 'SET_POLYHEDRON'
export const setPolyhedron = name => ({
  type: SET_POLYHEDRON,
  name,
})

const APPLY_OPERATION = 'APPLY_OPERATION'
export const applyOperation = (operation, config) => ({
  type: APPLY_OPERATION,
  operation,
  config,
})

const operations = {
  // P: getElongated,
  // A: getGyroElongated,
  '+': augment,
  '-': diminish,
  g: gyrate,
}

const initialState = {
  data: Polyhedron.get('tetrahedron'),
}

export default function polyhedron(state = initialState, action) {
  switch (action.type) {
    case SET_POLYHEDRON:
      if (!isValidSolid(action.name)) {
        return state
      }
      return { ...state, data: Polyhedron.get(action.name) }
    case APPLY_OPERATION:
      if (!operations[action.operation]) {
        return state
      }
      return {
        ...state,
        data: operations[action.operation](state.data, action.config),
      }
    default:
      return state
  }
}
