import * as fromConfig from './config'
import * as fromFilter from './filter'

export const getPolyhedronConfig = state => fromConfig.getPolyhedronConfig(state.config)
export const getConfigValues = state => fromConfig.getConfigValues(state.config)

export const getFilteredGroups = state => fromFilter.getFilteredGroups(state.filter)
export const getFilterText = state => fromFilter.getFilterText(state.filter)
