import React from 'react'
import { Route, IndexRoute } from 'react-router'
import App from './containers/App'
import Table from './containers/Table'
import Viewer from './containers/Viewer'

export default <Route path="/" component={App}>
  <IndexRoute component={Table} />
  <Route path=":solid" component={Viewer} />
</Route>
