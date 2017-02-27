import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import Viewer from './Viewer';
import Table from './Table';

const Root = () => (
  <Router history={browserHistory}>
    <Route path="/" component={Table} />
    <Route path="/:solid" component={Viewer} />
  </Router>
);

export default Root;
