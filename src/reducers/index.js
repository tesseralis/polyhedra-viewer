import { combineReducers } from 'redux'
import config from './config'
import polyhedron from './polyhedron'
import controls from './controls'

export default combineReducers({
  config,
  polyhedron,
  controls,
})
