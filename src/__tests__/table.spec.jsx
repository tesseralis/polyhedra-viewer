// @flow
import React from 'react';

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

  // FIXME console.log says it's all working as expected but the functions are still broken
  xit('generates a compact view on mobile vertical', () => {
    setup();
    // Ensure that these two big tables are split up in two
    page
      .setDevice('mobile')
      .expectElementWithText('caption', 'Bipyramids')
      .expectElementWithText('caption', 'Gyrate Rhombicos');
  });
});
