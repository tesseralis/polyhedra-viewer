
import React from 'react';
import ReactDOM from 'react-dom';
import ReactGA from 'react-ga';

import registerServiceWorker from './registerServiceWorker';
import Root from './components/Root';

import 'what-input';

import 'styles/reset.css';
import 'styles/box-sizing.css';
import 'styles/a11y.css';

const trackingId =
  process.env.NODE_ENV === 'production' ? 'UA-122991684-1' : 'UA-122991684-2';
ReactGA.initialize(trackingId);

const root = document.getElementById('root');
if (root) {
  ReactDOM.render(<Root />, root);
}
registerServiceWorker();
