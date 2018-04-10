import React, { Component } from 'react'
import { compose } from 'redux'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { css, StyleSheet } from 'aphrodite/no-important'
import { withRouter } from 'react-router-dom'

import { getPolyhedron } from 'selectors'
import { fixed, fullScreen } from 'styles/common'
import { withSetPolyhedron } from 'containers'
import { unescapeName } from 'polyhedra/names'
import { defaultConfig, getPolyhedronConfig } from 'constants/configOptions'

import X3dScene from './X3dScene'
import Polyhedron from './Polyhedron'
import { Sidebar } from './sidebar'
import Title from './Title'

const styles = StyleSheet.create({
  viewer: {
    ...fullScreen,
    display: 'grid',
    gridTemplateColumns: '400px 1fr',
    gridTemplateAreas: '"sidebar scene"',
  },
  sidebar: {
    height: '100%',
    // FIXME this is really janky and messes with the grid template
    position: 'fixed',
    left: 0,
    gridArea: 'sidebar',
  },
  scene: {
    gridArea: 'scene',
    width: '100%',
    height: '100%',
    minHeight: '100%',
  },
  title: {
    padding: 36,
    ...fixed('bottom', 'right'),
    maxWidth: '50%',
    textAlign: 'right',
  },
})

class Viewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      config: defaultConfig,
    }
  }

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
    const { config } = this.state
    // FIXME resizing (decreasing height) for the x3d scene doesn't work well
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.sidebar)}>
          <Sidebar
            solid={solid}
            config={config}
            setConfigValue={this.setConfigValue}
          />
        </div>
        <div className={css(styles.scene)}>
          <X3dScene>
            <Polyhedron config={getPolyhedronConfig(config)} />
          </X3dScene>
          <div className={css(styles.title)}>
            <Title name={unescapeName(solid)} />
          </div>
        </div>
      </div>
    )
  }

  setConfigValue = (key, value) => {
    if (key === null) {
      this.setState({ config: defaultConfig })
    }
    this.setState(({ config }) => ({ config: { ...config, [key]: value } }))
  }
}

// FIXME doesn't work after going back
export default compose(
  withRouter,
  withSetPolyhedron,
  connect(createStructuredSelector({ polyhedron: getPolyhedron })),
)(Viewer)
