import React from 'react'
import { Route, IndexRoute } from 'react-router'

import PeriodicTable from './components/PeriodicTable'
import App from './components/App'
import Viewer from './components/Viewer'

export default (
  <Route path="/" component={App}>
    <IndexRoute component={PeriodicTable} />
    <Route path=":solid" component={Viewer} />
  </Route>
)
