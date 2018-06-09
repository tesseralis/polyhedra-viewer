// @flow
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MobileProvider } from './MobileTracker';
import { ConfigProvider } from './ConfigContext';

import App from './App';

const Root = () => (
  <BrowserRouter>
    <MobileProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </MobileProvider>
  </BrowserRouter>
);

export default Root;
