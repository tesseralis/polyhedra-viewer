import React, { Component } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { css, StyleSheet } from 'aphrodite/no-important'
import { withRouter } from 'react-router-dom'

import { getPolyhedron } from 'selectors'
import { fixed, fullScreen } from 'styles/common'
import { withSetPolyhedron } from 'containers'

import X3dScene from './X3dScene'
import Polyhedron from './Polyhedron'
import { Sidebar, WithConfig } from './sidebar'

const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
  },
  sidebar: {
    height: '100%',
    position: 'fixed',
    right: 0,
  },
  title: {
    padding: 36,
    ...fixed('bottom', 'right'),
    maxWidth: '50%',
    textAlign: 'right',
  },
})

class Viewer extends Component {
  componentWillMount() {
    const { solid, setPolyhedron, history } = this.props
    setPolyhedron(solid)
    // Add a mock action to the history so that we don't "pop" whenever we change the solid
    history.replace(history.location.pathname)
  }

  componentWillReceiveProps(nextProps) {
    const { history, solid, polyhedron, setPolyhedron } = nextProps
    // If the name in the URL and the current name don't match up, push a new state
    if (solid !== polyhedron.name) {
      if (history.action === 'POP') {
        setPolyhedron(solid)
      } else {
        history.push(`/${polyhedron.name}/related`)
      }
    }
  }

  render() {
    const { solid } = this.props
    // FIXME resizing (decreasing height) for the x3d scene doesn't work well
    return (
      <WithConfig>
        {config => (
          <div className={css(styles.viewer)}>
            <X3dScene>
              <Polyhedron config={config} />
            </X3dScene>
            <div className={css(styles.sidebar)}>
              <Sidebar solid={solid} />
            </div>
          </div>
        )}
      </WithConfig>
    )
  }
}

// FIXME doesn't work after going back
export default compose(
  withRouter,
  withSetPolyhedron,
  connect(createStructuredSelector({ polyhedron: getPolyhedron })),
)(Viewer)
