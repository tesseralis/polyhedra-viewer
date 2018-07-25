// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import registerServiceWorker from './registerServiceWorker';
import Root from './components/Root';

const root = document.getElementById('root');
if (root) {
  ReactDOM.render(<Root />, root);
}
registerServiceWorker();
