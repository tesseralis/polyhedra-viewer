import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import App from 'components/App'
import configureStore from 'store/configureStore'
import Polyhedron from 'math/Polyhedron'

function mountViewer(path = '/tetrahedron') {
  return mount(
    <Provider store={configureStore()}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
}

describe('viewer', () => {
  it('works', () => {
    mountViewer()
  })

  it('can augment a tetrahedron', () => {
    const app = mountViewer('/tetrahedron/related')

    // click on the "augment" button
    const augmentButton = app.findWhere(
      n => n.type() === 'button' && n.text() === 'augment',
    )
    augmentButton.simulate('click')

    // simulate a click on any of the faces
    const shape = app.find('Faces').find('shape')
    shape.find('EventListener').prop('onLoad')()
    shape.simulate('mousemove', { hitPnt: [0, 0, 0] })
    shape.simulate('mousedown')
    shape.simulate('mouseup')

    // ensure that the url is now 'triangular-bipyramid/related'
    const expected = 'triangular-bipyramid'
    app.update()
    const viewer = app.find('Viewer')
    const history = viewer.prop('history')
    expect(history.location.pathname).toEqual(`/${expected}/related`)
    expect(
      app
        .find('Faces')
        .prop('solidData')
        .faceCount(),
    ).toEqual(Polyhedron.get(expected).faceCount())

    // verify that the solid being rendered is indeed a triangular bipyramid
  })
})
