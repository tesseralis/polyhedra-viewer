import React from 'react'
import { BrowserRouter, Route } from 'react-router-dom'

import 'styles/reset.css'
import 'styles/box-sizing.css'

import { PeriodicTable } from './table'
import { Viewer } from './viewer'

export default () => (
  <BrowserRouter>
    <div>
      <Route exact path="/" component={PeriodicTable} />
      <Route
        path="/:solid"
        component={({ match }) => <Viewer solidName={match.params.solid} />}
      />
    </div>
  </BrowserRouter>
)
