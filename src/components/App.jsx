// @flow
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loadable from 'react-loadable';

import 'what-input';

import 'styles/reset.css';
import 'styles/box-sizing.css';
import 'styles/a11y.css';

// TODO more interesting loading bar
const Loading = () => <div>Loading...</div>;

const HomePage = Loadable({
  loader: () => import('./HomePage'),
  loading: Loading,
});

const Viewer = Loadable({
  loader: () => import('./Viewer'),
  loading: Loading,
});

export default () => (
  <Switch>
    <Route exact path="/" component={HomePage} />
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
