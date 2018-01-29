import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import Polyhedron from 'math/Polyhedron'
import AppPage from 'pages/AppPage'

describe('viewer', () => {
  let appPage

  function setup(path = '/tetrahedron') {
    appPage = new AppPage(path)
  }

  beforeEach(() => {
    setup('/tetrahedron')
  })

  it('works', () => {
    setup()
  })

  it('can augment and diminish a tetrahedron', () => {
    setup('/tetrahedron/related')

    appPage
      .clickButtonWithText('augment')
      .clickFaceIndex(0)
      .expectTransitionTo('triangular-bipyramid')
      .clickButtonWithText('diminish')
      .clickFaceIndex(0)
      .expectTransitionTo('tetrahedron')
  })

  it('can transition through a pyramid series', () => {
    setup('/square-pyramid/related')

    appPage
      .clickButtonWithText('augment')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('octahedron')
      .clickButtonWithText('diminish')
      .clickFaceWithNumSides(3)
      .expectTransitionTo('square-pyramid')
      .clickButtonWithText('elongate')
      .expectTransitionTo('elongated-square-pyramid')
      .clickButtonWithText('augment')
  })

  it('can triaugment a trinagular prism', () => {
    setup('/triangular-prism/related')
    appPage
      // test gyrobifastigium
      .clickButtonWithText('augment')
      .clickButtonWithText('U2')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('gyrobifastigium')
      .clickButtonWithText('diminish')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('triangular-prism')
      // augmented with pyramids
      .clickButtonWithText('augment')
      .clickButtonWithText('Y4')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('augmented-triangular-prism')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('biaugmented-triangular-prism')
      .clickFaceWithNumSides(4)
      .expectTransitionTo('triaugmented-triangular-prism')
  })

  it('can go through a simple rhombicosadodecahedron workflow', () => {
    setup('/tridiminished-rhombicosidodecahedron/related')
    appPage
      .clickButtonWithText('augment')
      .clickFaceWithNumSides(10)
      .expectTransitionTo('gyrate-bidiminished-rhombicosidodecahedron')
      .clickFaceWithNumSides(10)
      .expectTransitionTo('bigyrate-diminished-rhombicosidodecahedron')
      .clickFaceWithNumSides(10)
      .expectTransitionTo('trigyrate-rhombicosidodecahedron')
  })

  it('unsets the mode and apply args when going to a different polyhedron', () => {
    setup('/triangular-cupola/related')
    appPage
      .clickButtonWithText('augment')
      .clickButtonWithText('elongate')
      .expectNoButtonWithText('ortho')
  })
})
