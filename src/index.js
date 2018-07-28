// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';

import registerServiceWorker from './registerServiceWorker';
import Root from './components/Root';

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-122991684-1');
  ReactGA.pageview(window.location.pathname + window.location.search);
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.render(<Root />, root);
}
registerServiceWorker();
