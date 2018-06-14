// @flow
import React from 'react';
import { mount } from 'enzyme';

import AppPage from 'pages/AppPage';

describe('table', () => {
  let appPage;

  function setup() {
    appPage = new AppPage('/');
  }

  beforeEach(() => {
    setup();
  });

  it('works', () => {
    setup();
  });

  it('generates a compact view on mobile vertical', () => {
    setup();
    // Ensure that these two big tables are split up in two
    appPage
      .setDevice('mobile')
      .expectElementWithText('caption', 'Bipyramids')
      .expectElementWithText('caption', 'Gyrate Rhombicos');
  });
});
