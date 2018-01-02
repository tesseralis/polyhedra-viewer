import React from 'react'
import { Route, IndexRoute } from 'react-router'

import PeriodicTable from './components/PeriodicTable'
import App from './containers/App'
import Viewer from './containers/Viewer'

export default (
  <Route path="/" component={App}>
    <IndexRoute component={PeriodicTable} />
    <Route path=":solid" component={Viewer} />
  </Route>
)
