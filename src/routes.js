import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Viewer from './containers/Viewer'
import Table from './components/Table'
import App from './components/App'

export default <Route path="/" component={App}>
  <IndexRoute component={Table} />
  <Route path=":solid" component={Viewer} />
</Route>
