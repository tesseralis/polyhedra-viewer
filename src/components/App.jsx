// @flow
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loadable from 'react-loadable';

// TODO I don't think this is the best place to put these imports
import 'what-input';

import 'styles/reset.css';
import 'styles/box-sizing.css';
import 'styles/a11y.css';

import { randomSolidName } from 'polyhedra/names';
import Loading from './Loading';

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
    <Route
      exact
      path="/"
      render={({ location }) => <HomePage hash={location.hash.substring(1)} />}
    />
    <Route
      exact
      path="/random"
      render={() => <Redirect to={randomSolidName()} />}
    />
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
