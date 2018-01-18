import { combineReducers } from 'redux'
import config from './config'
import filter from './filter'
import polyhedron from './polyhedron'
import controls from './controls'

export default combineReducers({
  config,
  filter,
  polyhedron,
  controls,
})
