import { createStore } from 'redux'
import rootReducer from '../reducers'

const configureStore = preloadedState => createStore(rootReducer, preloadedState)

export default configureStore
