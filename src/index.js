import React from 'react'
import ReactDOM from 'react-dom'
import { browserHistory } from 'react-router'
import 'font-awesome/css/font-awesome.css'

import configureStore from './store/configureStore'
import Root from './containers/Root'

const store = configureStore()

ReactDOM.render(
  <Root store={store} history={browserHistory}/>,
  document.getElementById('root')
)
