import ViewerPage from 'pages/ViewerPage';
import { PageOptions } from 'pages/AppPage';

describe('viewer', () => {
  let page: ViewerPage;

  function setup(solid = 'tetrahedron', panel?: string, options?: PageOptions) {
    page = new ViewerPage(solid, panel, options);
  }

  beforeEach(() => {
    setup('tetrahedron');
  });

  it('works', () => {
    setup();
  });

  it('works on mobile', () => {
    setup('tetrahedron', 'operations', { device: 'mobile' });
    page
      .clickButtonWithText('truncate')
      .expectTransitionTo('truncated-tetrahedron');
  });

  it('resets the operation when unset', () => {
    setup('triangular-cupola');
    page
      .clickButtonWithText('augment')
      .clickButtonWithText('augment')
      .expectNoButtonWithText('ortho');
  });

  it('does not applyOperation on invalid apply args', () => {
    setup('augmented-truncated-tetrahedron');
    page.clickButtonWithText('diminish').clickFaceWithNumSides(6);
  });

  it('unsets the operation and options when going to a different polyhedron', () => {
    setup('triangular-cupola');
    page
      .clickButtonWithText('augment')
      .clickButtonWithText('elongate')
      .expectNoButtonWithText('ortho');
  });

  it('unsets the operation when there are no more options', () => {
    setup('cuboctahedron');
    page
      .clickButtonWithText('sharpen')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('octahedron')
      .expectOperation('');
  });

  it('unsets the operation when clicking a different tab', () => {
    setup('tetrahedron');
    page
      .clickButtonWithText('augment')
      .clickLinkWithText('Options')
      .expectNoElementWithText('p', 'Select a face')
      .clickLinkWithText('Operations')
      .expectNoElementWithText('p', 'Select a face');
  });

  it('can augment and diminish a tetrahedron', () => {
    setup('tetrahedron');
    page
      .clickButtonWithText('augment')
      .clickAnyFace()
      .expectTransitionTo('triangular-bipyramid')
      .clickButtonWithText('diminish')
      .clickAnyFace()
      .expectTransitionTo('tetrahedron');
  });

  it('shows options on snub only when chiral options available', () => {
    setup('tetrahedron');

    page
      .clickButtonWithText('snub')
      .expectTransitionTo('icosahedron')
      .clickButtonWithText('snub')
      .clickButtonWithText('left')
      .expectTransitionTo('snub-dodecahedron');
  });

  it('twists things left and right correctly', () => {
    setup('gyroelongated-pentagonal-bicupola');

    page
      .clickButtonWithText('shorten')
      .clickButtonWithText('right')
      .expectTransitionTo('pentagonal-gyrobicupola');

    setup('gyroelongated-pentagonal-bicupola');

    page
      .clickButtonWithText('shorten')
      .clickButtonWithText('left')
      .expectTransitionTo('pentagonal-orthobicupola');
  });

  it('can transition through a pyramid series', () => {
    setup('square-pyramid');

    page
      .clickButtonWithText('augment')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('octahedron')
      .clickButtonWithText('diminish')
      .clickFaceWithNumSides(3)
      .expectTransitionTo('square-pyramid')
      .clickButtonWithText('elongate')
      .expectTransitionTo('elongated-square-pyramid')
      .clickButtonWithText('augment');
  });

  it('can augment triangular prism with pyramid and cupola', () => {
    setup('triangular-prism');
    page
      // test gyrobifastigium
      .clickButtonWithText('augment')
      .clickButtonWithText('fastigium')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('gyrobifastigium')
      .clickButtonWithText('diminish')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('triangular-prism')
      // augmented with pyramids
      .clickButtonWithText('augment')
      .clickButtonWithText('pyramid')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('augmented-triangular-prism')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('biaugmented-triangular-prism')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('triaugmented-triangular-prism');
  });

  it('can go through a simple rhombicosadodecahedron workflow', () => {
    setup('tridiminished-rhombicosidodecahedron');
    // make sure we can augment multiple times without resetting operation
    page
      .clickButtonWithText('augment')
      .clickButtonWithText('ortho')
      .clickFaceWithNumSides(10)
      .expectTransitionTo('gyrate-bidiminished-rhombicosidodecahedron')
      .clickButtonWithText('ortho')
      .clickFaceWithNumSides(10)
      .expectTransitionTo('bigyrate-diminished-rhombicosidodecahedron')
      .clickButtonWithText('ortho')
      .clickFaceWithNumSides(10)
      .expectTransitionTo('trigyrate-rhombicosidodecahedron');
  });

  it('can go through an expansion workflow', () => {
    setup('dodecahedron');
    page
      .clickButtonWithText('expand')
      .expectTransitionTo('rhombicosidodecahedron')
      .clickButtonWithText('diminish')
      .clickAnyFace()
      .expectTransitionTo('diminished-rhombicosidodecahedron');
  });

  // TODO the test is broken most likely due to history being mutable.
  // it works fine when testing -- might want to try to find an alternate
  // means of checking if you've gone back.
  xit('can go backwards in the url', () => {
    setup('tetrahedron');
    page
      .clickButtonWithText('truncate')
      .expectTransitionTo('truncated-tetrahedron')
      .goBack()
      .expectTransitionTo('tetrahedron')
      .clickButtonWithText('truncate')
      .expectTransitionTo('truncated-tetrahedron');
  });
});
