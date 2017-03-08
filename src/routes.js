import React from 'react'
import { Route, IndexRoute } from 'react-router'
import Viewer from './containers/Viewer'
import App from './containers/App'
import Table from './components/Table'

export default <Route path="/" component={App}>
  <IndexRoute component={Table} />
  <Route path=":solid" component={Viewer} />
</Route>
