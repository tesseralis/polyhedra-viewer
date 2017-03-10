import { combineReducers } from 'redux'
import config from './config'
import filter from './filter'

const rootReducer = combineReducers({
  config,
  filter,
})

export default rootReducer
