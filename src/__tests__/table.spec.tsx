import AppPage from 'pages/AppPage';

describe('table', () => {
  let page: AppPage;

  function setup(route = '/', options = {}) {
    page = new AppPage(route, options);
  }

  beforeEach(() => {
    setup();
  });

  it('works', () => {
    setup();
  });

  it('generates a compact view on mobile vertical', () => {
    setup('/', { device: 'mobile', orientation: 'portrait' });
    // Ensure that these two big tables are split up in two
    page
      .expectElementWithText('caption', 'Bipyramids')
      .expectElementWithText('caption', 'Gyrate Rhombicos');
  });
});
