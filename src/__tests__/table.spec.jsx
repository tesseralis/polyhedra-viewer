// @flow
import React from 'react';
import { mount } from 'enzyme';

import AppPage from 'pages/AppPage';

describe('table', () => {
  let page;

  function setup() {
    page = new AppPage('/');
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
    page
      .setDevice('mobile')
      .expectElementWithText('caption', 'Bipyramids')
      .expectElementWithText('caption', 'Gyrate Rhombicos');
  });
});
