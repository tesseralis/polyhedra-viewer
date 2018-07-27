// @flow
import React from 'react';
import ReactGA from 'react-ga';
import { BrowserRouter } from 'react-router-dom';
import { DeviceProvider } from './DeviceContext';
import { ConfigProvider } from './ConfigContext';

import App from './App';

if (process.env.NODE_ENV === 'production') {
  ReactGA.initialize('UA-122991684-1');
  ReactGA.pageview(window.location.pathname + window.location.search);
}

const Root = () => (
  <BrowserRouter>
    <DeviceProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </DeviceProvider>
  </BrowserRouter>
);

export default Root;
