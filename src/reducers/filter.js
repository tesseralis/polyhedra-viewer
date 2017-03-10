import { SET_FILTER_TEXT } from '../constants/ActionTypes'
import { groups } from '../constants/polyhedra'

const initialState = {
  text: ''
}

export default function filter(state = initialState, action) {
  switch(action.type) {
    case SET_FILTER_TEXT:
      return { ...state, text: action.value || '' }
    default:
      return state
  }
}

const getFilteredPolyhedra = (polyhedra, filter) =>
  polyhedra.filter(solid => solid.includes(filter.toLowerCase()))

export const getFilteredGroups = state => groups.map(({ polyhedra, ...group}) => ({
  ...group,
  polyhedra: getFilteredPolyhedra(polyhedra, state.text)
})).filter(({ polyhedra }) => polyhedra.length !== 0)
