import React from 'react'
import ReactDOM from 'react-dom'
import { browserHistory } from 'react-router'

import configureStore from './store/configureStore'
import Root from './containers/Root'

const store = configureStore()

ReactDOM.render(
  <Root store={store} history={browserHistory}/>,
  document.getElementById('root')
)
