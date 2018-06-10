// @flow
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { mount } from 'enzyme';

import AppPage from 'pages/AppPage';

describe('viewer', () => {
  let appPage;

  function setup(path = '/tetrahedron') {
    appPage = new AppPage(path);
  }

  beforeEach(() => {
    setup('/tetrahedron');
  });

  it('works', () => {
    setup();
  });

  // TODO probably want to do all these basic ops on mobile as well
  it('resets the operation when unset', () => {
    setup('/triangular-cupola/operations');
    appPage
      .clickButtonWithText('augment')
      .clickButtonWithText('augment')
      .expectNoButtonWithText('ortho');
  });

  it('does not applyOperation on invalid apply args', () => {
    setup('/augmented-truncated-tetrahedron/operations');
    appPage.clickButtonWithText('diminish').clickFaceWithNumSides(6);
  });

  it('unsets the operation and options when going to a different polyhedron', () => {
    setup('/triangular-cupola/operations');
    appPage
      .clickButtonWithText('augment')
      .clickButtonWithText('elongate')
      .expectNoButtonWithText('ortho');
  });

  it('unsets the operation when there are no more options', () => {
    setup('/tetrahedron/operations');
    appPage
      .clickButtonWithText('rectify')
      .expectTransitionTo('octahedron')
      .expectOperation('');
  });

  it('can augment and diminish a tetrahedron', () => {
    setup('/tetrahedron/operations');

    appPage
      .clickButtonWithText('augment')
      .clickAnyFace()
      .expectTransitionTo('triangular-bipyramid')
      .clickButtonWithText('diminish')
      .clickAnyFace()
      .expectTransitionTo('tetrahedron');
  });

  it('shows options on snub only when chiral options available', () => {
    setup('/tetrahedron/operations');

    appPage
      .clickButtonWithText('snub')
      .expectTransitionTo('icosahedron')
      .clickButtonWithText('snub')
      .clickButtonWithText('left')
      .expectTransitionTo('snub-dodecahedron');
  });

  it('twists things left and right correctly', () => {
    setup('/gyroelongated-pentagonal-bicupola');

    appPage
      .clickButtonWithText('shorten')
      .clickButtonWithText('right')
      .expectTransitionTo('pentagonal-gyrobicupola');

    setup('/gyroelongated-pentagonal-bicupola');

    appPage
      .clickButtonWithText('shorten')
      .clickButtonWithText('left')
      .expectTransitionTo('pentagonal-orthobicupola');
  });

  it('can transition through a pyramid series', () => {
    setup('/square-pyramid/operations');

    appPage
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
    setup('/triangular-prism/operations');
    appPage
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
    setup('/tridiminished-rhombicosidodecahedron/operations');
    // make sure we can augment multiple times without resetting operation
    appPage
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
    setup('/dodecahedron/operations');
    // TODO test contract/snub/twist
    appPage
      .clickButtonWithText('expand')
      .expectTransitionTo('rhombicosidodecahedron')
      .clickButtonWithText('diminish')
      .clickAnyFace()
      .expectTransitionTo('diminished-rhombicosidodecahedron');
  });
});
