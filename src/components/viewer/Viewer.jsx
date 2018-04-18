import _ from 'lodash'
import React, { Component } from 'react'
import { css, StyleSheet } from 'aphrodite/no-important'

import { isValidSolid } from 'data'
import { andaleMono } from 'styles/fonts'
import Polyhedron from 'math/Polyhedron'
import { fixed, fullScreen } from 'styles/common'
import { unescapeName } from 'polyhedra/names'
import applyOperation from 'polyhedra/applyOperation'
import { getRelations, applyOptionsFor } from 'polyhedra/relations'
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
    ...fixed('bottom', 'right'),
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },
  description: {
    ...fixed('top', 'right'),
    padding: 36,
    fontSize: 24,
    fontFamily: andaleMono,
    textAlign: 'right',
  },
})

const operationDescriptions = {
  '+': 'Click on a face to add a pyramid or cupola.',
  '-': 'Click on a set of faces to remove them.',
  g: 'Click on a set of faces to gyrate them.',
}

function viewerStateFromSolidName(name) {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`)
  }
  return {
    polyhedron: Polyhedron.get(name),
    animationData: null,
    operation: null,
    applyOptions: {},
  }
}

export default class Viewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      polyhedron: Polyhedron.get(props.solid),
      animationData: null,
      config: defaultConfig,
      operation: null,
      applyOptions: {},
    }
  }

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
    const {
      polyhedron,
      animationData,
      operation,
      config,
      applyOptions,
    } = this.state
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
              animationData={animationData}
              config={getPolyhedronConfig(config)}
              operation={operation}
              applyOperation={this.applyOperation}
            />
          </X3dScene>
          <div className={css(styles.title)}>
            <Title name={unescapeName(solid)} />
          </div>
          {_.has(operationDescriptions, operation) && (
            <div className={css(styles.description)}>
              {operationDescriptions[operation]}
            </div>
          )}
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

  setOperation = operation => {
    this.setState(({ polyhedron }) => ({
      operation,
      applyOptions: applyOptionsFor(polyhedron.name, operation),
    }))
  }

  applyOperation = (operation, args) => {
    this.setState(({ polyhedron, applyOptions }) => {
      const { result, animationData } = applyOperation(operation, polyhedron, {
        ...args,
        ...applyOptions,
      })
      console.log('result', result)
      // FIXME gyrate -> twist needs to be unset
      const postOpState = (() => {
        if (_.isEmpty(getRelations(result.name, operation))) {
          return { operation: null, applyOptions: {} }
        } else {
          return { applyOptions: applyOptionsFor(result.name, operation) }
        }
      })()
      return {
        polyhedron: result,
        animationData,
        ...postOpState,
      }
    })
  }

  // TODO animation recenter
  recenter = () => {
    this.setState(({ polyhedron }) => ({
      polyhedron: polyhedron.center(),
      animationData: null,
    }))
  }

  setApplyOpt = (name, value) => {
    this.setState(({ applyOptions }) => ({
      applyOptions: { ...applyOptions, [name]: value },
    }))
  }
}
