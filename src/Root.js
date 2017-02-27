import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import Viewer from './Viewer';

const Root = () => (
  <Router history={browserHistory}>
    <Route path="/(:solid)" component={Viewer} />
  </Router>
);

export default Root;
