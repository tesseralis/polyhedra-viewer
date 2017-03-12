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

// TODO move selectors to their own file when I have enough

export const getFilterText = state => state.text

const getFilteredPolyhedra = (polyhedra, filter) => (
  polyhedra.filter(solid => solid.includes(filter.toLowerCase()))
)

const filterGroups = (groups, filterText) => groups.map(group => {
  if (group.groups) {
    return {
      ...group,
      groups: filterGroups(group.groups, filterText),
    }
  }
  return {
    ...group,
    polyhedra: getFilteredPolyhedra(group.polyhedra, filterText),
  }
}).filter(({ groups, polyhedra }) => (groups && groups.length > 0) || (polyhedra && polyhedra.length > 0))

export const getFilteredGroups = createSelector(
  getFilterText,
  filterText => filterGroups(groups, filterText)
)

