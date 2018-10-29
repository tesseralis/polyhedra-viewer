// @flow
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { DeviceProvider } from './useMediaInfo';
import Config from './ConfigContext';
import PageTracker from './PageTracker';

import App from './App';

const Root = () => {
  return (
    <BrowserRouter>
      <DeviceProvider>
        <Config.Provider>
          <PageTracker />
          <App />
        </Config.Provider>
      </DeviceProvider>
    </BrowserRouter>
  );
};

export default Root;
