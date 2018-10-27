// @flow
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { DeviceProvider } from './useMediaInfo';
import { ConfigProvider } from './ConfigContext';
import PageTracker from './PageTracker';

import App from './App';

const Root = () => {
  return (
    <BrowserRouter>
      <DeviceProvider>
        <ConfigProvider>
          <PageTracker />
          <App />
        </ConfigProvider>
      </DeviceProvider>
    </BrowserRouter>
  );
};

export default Root;
