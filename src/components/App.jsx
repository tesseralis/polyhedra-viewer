// @flow
import React from 'react';
import { Route, Redirect, Switch } from 'react-router-dom';
import Loadable from 'react-loadable';

import { isValidSolid } from 'data';
import {
  escapeName,
  randomSolidName,
  isConwaySymbol,
  fromConwayNotation,
  isAlternateName,
  getCanonicalName,
} from 'polyhedra/names';

import ErrorPage from './ErrorPage';
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
      path="/:solid"
      render={({ match, history }) => {
        const solid = match.params.solid || '';
        if (isConwaySymbol(solid)) {
          const fullName = escapeName(fromConwayNotation(solid));
          const newPath = history.location.pathname.replace(solid, fullName);
          return <Redirect to={newPath} />;
        }
        if (isAlternateName(solid)) {
          const fullName = escapeName(getCanonicalName(solid));
          const newPath = history.location.pathname.replace(solid, fullName);
          return <Redirect to={newPath} />;
        }
        if (isValidSolid(solid)) {
          return <Viewer solid={solid} url={match.url} history={history} />;
        }
        return <ErrorPage />;
      }}
    />
  </Switch>
);
