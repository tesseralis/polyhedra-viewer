import { getSolidData, isValidSolid } from 'constants/polyhedra'
import {
  getElongated,
  getGyroElongated,
  getAugmented,
  getDiminished,
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
  P: getElongated,
  A: getGyroElongated,
  '+': getAugmented,
  '-': getDiminished,
}

const initialState = getSolidData('tetrahedron')

export default function polyhedron(state = initialState, action) {
  switch (action.type) {
    case SET_POLYHEDRON:
      return isValidSolid(action.name) ? getSolidData(action.name) : state
    case APPLY_OPERATION:
      return operations[action.operation]
        ? operations[action.operations](state, action.config.name)
        : state
    default:
      return state
  }
}
