// @flow
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loadable from 'react-loadable';

import 'what-input';

import 'styles/reset.css';
import 'styles/box-sizing.css';
import 'styles/a11y.css';

// import PeriodicTable from './PeriodicTable';
// import Viewer from './Viewer';

const Loading = () => <div>Loading...</div>;

const PeriodicTable = Loadable({
  loader: () => import('./PeriodicTable'),
  loading: Loading,
});

const Viewer = Loadable({
  loader: () => import('./Viewer'),
  loading: Loading,
});

export default () => (
  <Switch>
    <Route exact path="/" component={PeriodicTable} />
    <Route
      exact
      path="/:solid"
      render={({ match, history }) => (
        <Redirect to={`${match.url}/operations`} />
      )}
    />
    <Route
      path="/:solid/:panel"
      render={({ match, history }) => (
        <Viewer
          solid={match.params.solid}
          panel={match.params.panel}
          history={history}
        />
      )}
    />
  </Switch>
);
