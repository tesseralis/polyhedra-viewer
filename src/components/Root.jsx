// @flow
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { wrapProviders } from 'components/common';
import { DeviceProvider } from './useMediaInfo';
import Config from './ConfigModel';
import PageTracker from './PageTracker';

import App from './App';
const Providers = wrapProviders([
  BrowserRouter,
  DeviceProvider,
  Config.Provider,
]);

const Root = () => {
  return (
    <Providers>
      <PageTracker />
      <App />
    </Providers>
  );
};

export default Root;
