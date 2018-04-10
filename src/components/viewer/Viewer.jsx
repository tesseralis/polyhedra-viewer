import _ from 'lodash'
import React, { Component } from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'
import { withRouter } from 'react-router-dom'

import { isValidSolid } from 'data'
import Polyhedron from 'math/Polyhedron'
import { fixed, fullScreen } from 'styles/common'
import { unescapeName } from 'polyhedra/names'
import doApplyOperation from 'polyhedra/applyOperation'
import { getRelations, getUsingOpts } from 'polyhedra/relations'
import { defaultConfig, getPolyhedronConfig } from 'constants/configOptions'

import X3dScene from './X3dScene'
import X3dPolyhedron from './Polyhedron'
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

function hasMultipleOptionsForFace(relations) {
  return _.some(relations, relation => _.includes(['U2', 'R5'], relation.using))
}

function viewerStateFromSolidName(name) {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`)
  }
  return {
    polyhedron: Polyhedron.get(name),
    operation: null,
    applyOptions: {},
  }
}

export default class Viewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      polyhedron: Polyhedron.get(props.solid),
      config: defaultConfig,
      operation: null,
      applyOptions: {},
    }
  }

  // FIXME do "pop" again; update from history
  static getDerivedStateFromProps(nextProps, prevState) {
    const { polyhedron } = prevState
    const { solid } = nextProps

    if (solid !== polyhedron.name) {
      // If not the result of an operation, update our solid based on the name we got
      return viewerStateFromSolidName(solid)
    }
    return prevState
  }

  componentDidUpdate(prevProps) {
    const { history, solid } = this.props
    const { polyhedron } = this.state
    if (polyhedron.name !== solid && solid === prevProps.solid) {
      history.push(`/${polyhedron.name}/related`)
    }
  }

  render() {
    const { solid } = this.props
    const { polyhedron, operation, config, applyOptions } = this.state
    // FIXME resizing (decreasing height) for the x3d scene doesn't work well
    return (
      <div className={css(styles.viewer)}>
        <div className={css(styles.sidebar)}>
          <Sidebar
            configProps={{
              inputValues: config,
              setInputValue: this.setConfigValue,
            }}
            relatedPolyhedraProps={{
              solid,
              operation,
              applyOptions,
              ..._.pick(this, [
                'applyOperation',
                'recenter',
                'setOperation',
                'setApplyOpt',
              ]),
            }}
          />
        </div>
        <div className={css(styles.scene)}>
          <X3dScene>
            <X3dPolyhedron
              solidData={polyhedron}
              config={getPolyhedronConfig(config)}
              operation={operation}
              applyOperation={this.applyOperation}
            />
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

  applyOptionsFor = (solid, operation) => {
    if (!solid) return
    const relations = getRelations(solid, operation)
    const newOpts = {}
    if (operation === '+') {
      if (_.filter(relations, 'gyrate').length > 1) {
        newOpts.gyrate = 'ortho'
      }
      if (hasMultipleOptionsForFace(relations)) {
        newOpts.using = getUsingOpts(solid)[0]
      }
    }
    return newOpts
  }

  setOperation = operation => {
    this.setState(({ polyhedron }) => ({
      operation,
      applyOptions: this.applyOptionsFor(polyhedron.name, operation),
    }))
  }

  applyOperation = (operation, args) => {
    this.setState(({ polyhedron, applyOptions }) => {
      const result = doApplyOperation(operation, polyhedron, {
        ...args,
        ...applyOptions,
      })
      // FIXME gyrate -> twist needs to be unset
      const postOpState = (() => {
        if (_.isEmpty(getRelations(result.name, operation))) {
          return { operation: null, applyOptions: {} }
        } else {
          return { applyOptions: this.applyOptionsFor(result.name, operation) }
        }
      })()
      return {
        polyhedron: result,
        ...postOpState,
      }
    })
  }

  recenter = () => {
    this.setState(({ polyhedron }) => ({ polyhedron: polyhedron.center() }))
  }

  setApplyOpt = (name, value) => {
    this.setState(({ applyOptions }) => ({
      applyOptions: { ...applyOptions, [name]: value },
    }))
  }
}
