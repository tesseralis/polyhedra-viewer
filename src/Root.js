import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import App from './App';

const Root = () => (
  <Router history={browserHistory}>
    <Route path="/(:solid)" component={App} />
  </Router>
);

export default Root;
