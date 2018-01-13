import React from 'react'
import { Router } from 'react-router'
import { Provider } from 'react-redux'

import Routes from './Routes'

const Root = ({ store, history }) => (
  <Provider store={store}>
    <Router history={history} routes={Routes} />
  </Provider>
)

export default Root
