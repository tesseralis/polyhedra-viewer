
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import { wrapProviders } from 'components/common';
import { DeviceProvider } from './useMediaInfo';
import ConfigCtx from './ConfigCtx';
import PageTracker from './PageTracker';

import App from './App';
const Providers = wrapProviders([
  BrowserRouter,
  DeviceProvider,
  ConfigCtx.Provider,
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
