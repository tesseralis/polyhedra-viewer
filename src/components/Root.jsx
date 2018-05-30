// @flow
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from './ConfigContext';

import App from './App';

const Root = () => (
  <BrowserRouter>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </BrowserRouter>
);

export default Root;
