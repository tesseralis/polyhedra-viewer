import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'

import App from 'components/App'
import configureStore from 'store/configureStore'

function mountViewer() {
  return mount(
    <Provider store={configureStore()}>
      <MemoryRouter initialEntries={['/tetrahedron']}>
        <App />
      </MemoryRouter>
    </Provider>,
  )
}

describe('viewer', () => {
  it('works', () => {
    mountViewer()
  })
})
