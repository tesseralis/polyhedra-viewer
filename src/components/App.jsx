import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import * as queryString from 'query-string'

import 'styles/reset.css'
import 'styles/box-sizing.css'

import { PeriodicTable } from './table'
import { Viewer } from './viewer'

const ViewerComponent = ({ match, location }) => {
  const parsed = queryString.parse(location.search)
  return <Viewer solid={match.params.solid} operation={parsed.op} />
}

export default () => (
  <BrowserRouter>
    <div>
      <Route exact path="/" component={PeriodicTable} />
      <Route path="/:solid" component={ViewerComponent} />
    </div>
  </BrowserRouter>
)
