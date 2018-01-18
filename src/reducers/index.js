import { combineReducers } from 'redux'
import config from './config'
import filter from './filter'
import polyhedron from './polyhedron'

export default combineReducers({
  config,
  filter,
  polyhedron,
})
