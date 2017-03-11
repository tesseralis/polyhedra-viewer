import { combineReducers } from 'redux'
import config, * as fromConfig from './config'
import filter, * as fromFilter from './filter'

const rootReducer = combineReducers({
  config,
  filter,
})

export default rootReducer

// TODO is there a way we can hook these up automatically
export const getPolyhedronConfig = state => fromConfig.getPolyhedronConfig(state.config)
export const getConfigValues = state => fromConfig.getConfigValues(state.config)

export const getFilteredGroups = state => fromFilter.getFilteredGroups(state.filter)
export const getFilterText = state => fromFilter.getFilterText(state.filter)
