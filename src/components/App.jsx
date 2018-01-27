import React from 'react'
import { Route } from 'react-router-dom'
import * as queryString from 'query-string'

import 'styles/reset.css'
import 'styles/box-sizing.css'

import { PeriodicTable } from './table'
import { Viewer } from './viewer'

const ViewerComponent = ({ match }) => {
  return <Viewer solid={match.params.solid} />
}

export default () => (
  <div>
    <Route exact path="/" component={PeriodicTable} />
    <Route path="/:solid" component={ViewerComponent} />
  </div>
)
