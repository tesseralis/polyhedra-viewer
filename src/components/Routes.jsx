import React from 'react'
import { Route, IndexRoute } from 'react-router'

import PeriodicTable from './PeriodicTable'
import App from './App'
import Viewer from './Viewer'

export default (
  <Route path="/" component={App}>
    <IndexRoute component={PeriodicTable} />
    <Route path=":solid" component={Viewer} />
  </Route>
)
