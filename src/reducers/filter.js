import { createSelector } from 'reselect'

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

// TODO should I move selectors to their own file?

export const getFilterText = state => state.text

const getFilteredPolyhedra = (polyhedra, filter) => (
  polyhedra.filter(solid => solid.includes(filter.toLowerCase()))
)

export const getFilteredGroups = createSelector(
  getFilterText,
  filterText => {
    return groups.map(({ polyhedra, ...group}) => ({
      ...group,
      polyhedra: getFilteredPolyhedra(polyhedra, filterText)
    })).filter(({ polyhedra }) => polyhedra.length !== 0)
  }
)

