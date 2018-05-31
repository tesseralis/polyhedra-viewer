// @flow
import React from 'react';
import { Route } from 'react-router-dom';

import 'styles/reset.css';
import 'styles/box-sizing.css';

import PeriodicTable from './PeriodicTable';
import Viewer from './Viewer';

export default () => (
  <div>
    <Route exact path="/" component={PeriodicTable} />
    <Route
      path="/:solid"
      render={({ match, history }) => (
        <Viewer solid={match.params.solid} history={history} />
      )}
    />
  </div>
);
