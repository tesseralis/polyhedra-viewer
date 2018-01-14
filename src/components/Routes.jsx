import React from 'react'
import { Route, IndexRoute } from 'react-router'

import App from './App'
import { PeriodicTable } from './table'
import { Viewer } from './viewer'

export default (
  <Route path="/" component={App}>
    <IndexRoute component={PeriodicTable} />
    <Route path=":solid" component={Viewer} />
  </Route>
)
