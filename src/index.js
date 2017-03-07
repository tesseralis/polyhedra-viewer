import React from 'react'
import ReactDOM from 'react-dom'
import { createStore } from 'redux'
import { Provider } from 'react-redux'
import 'font-awesome/css/font-awesome.css'

import Root from './Root'
import reducer from './reducers'
import './styles/reset.css'
import './styles/box-sizing.css'

const store = createStore(reducer)

ReactDOM.render(
  <Provider store={store}>
    <Root />
  </Provider>,
  document.getElementById('root')
)
