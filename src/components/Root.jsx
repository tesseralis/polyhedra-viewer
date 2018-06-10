// @flow
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DeviceProvider } from './DeviceContext';
import { ConfigProvider } from './ConfigContext';

import App from './App';

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
