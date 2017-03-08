import React from 'react'
import ReactDOM from 'react-dom'
import { browserHistory } from 'react-router'
import { createStore } from 'redux'
import 'font-awesome/css/font-awesome.css'

import Root from './containers/Root'
import reducer from './reducers'
import './styles/reset.css'
import './styles/box-sizing.css'

const store = createStore(reducer)

ReactDOM.render(
  <Root store={store} history={browserHistory}/>,
  document.getElementById('root')
)
