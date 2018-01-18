import { createSelector } from 'reselect'
import { groups } from '../constants/polyhedra'

const getFilteredPolyhedra = (polyhedra, filter) =>
  polyhedra.filter(solid => solid.includes(filter.toLowerCase()))

const filterGroups = (groups, filterText) =>
  groups
    .map(group => {
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
    })
    .filter(
      ({ groups, polyhedra }) =>
        (groups && groups.length > 0) || (polyhedra && polyhedra.length > 0),
    )

const getFilter = state => state.filter

export const getFilterText = createSelector(getFilter, filter => filter.text)

export const getFilteredGroups = createSelector(
  filterText => (filterText ? filterGroups(groups, filterText) : groups),
)
