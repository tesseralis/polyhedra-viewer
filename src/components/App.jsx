// @flow
import React, { Fragment } from 'react';
import { Route, Redirect } from 'react-router-dom';
import 'what-input';

import 'styles/reset.css';
import 'styles/box-sizing.css';
import 'styles/a11y.css';

import PeriodicTable from './PeriodicTable';
import Viewer from './Viewer';

export default () => (
  <Fragment>
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
  </Fragment>
);
