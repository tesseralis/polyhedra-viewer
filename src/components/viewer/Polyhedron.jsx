import React, { Component } from 'react'
import { Motion, spring, presets } from 'react-motion'
import { rgb } from 'd3-color'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { withRouter } from 'react-router-dom'

import polygons from 'constants/polygons'
import {
  getPolyhedron,
  getPolyhedronConfig,
  getOperation,
  getApplyOpts,
} from 'selectors'
import { applyOperation } from 'actions'
import { mapObject } from 'util.js'
import { getAugmentFace } from 'math/operations'

// Join a list of lists with an inner and outer separator.
export const joinListOfLists = (list, outerSep, innerSep) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep)
}

const Coordinates = ({ points }) => {
  // We pad the number of points in case we move from a solid with more vertices
  // to one with less, so that x3dom does accidentally map an index to a non-existing point
  const buffer = _.times(100, _.constant([0, 0, 0]))
  const bufferedPoints = points.concat(buffer)

  return <coordinate point={joinListOfLists(bufferedPoints, ', ', ' ')} />
}

/* Faces */

// Convert the hex color to RGB
const toRgb = hex =>
  ['r', 'g', 'b'].map(_.propertyOf(rgb(hex))).map(d => d / 255)
const colorIndexForFace = mapObject(polygons, _.nthArg(1))
const getColorIndex = face => colorIndexForFace[face.length]
const polygonColors = colors => polygons.map(n => toRgb(colors[n]))
const getColorAttr = colors =>
  joinListOfLists(polygonColors(colors).concat([[0, 1, 0]]), ',', ' ')

class Faces extends Component {
  state = {
    highlightFaceIndices: [],
    applyArgs: null,
    error: null,
  }

  componentDidMount() {
    this.drag = false
    // TODO make sure this doesn't have a race condition
    document.onload = _.once(() => {
      this.shape.addEventListener(
        'mousedown',
        this.wrapError(this.handleMouseDown),
      )
      this.shape.addEventListener('mouseup', this.wrapError(this.handleMouseUp))
      this.shape.addEventListener(
        'mousemove',
        this.wrapError(_.throttle(this.handleMove, 200)),
      )
    })
  }

  // FIXME find a better way to do this?
  wrapError = fn => event => {
    try {
      fn(event)
    } catch (error) {
      this.setState({ error })
    }
  }

  render() {
    const { solidData, config } = this.props
    const { highlightFaceIndices, error } = this.state
    const { opacity, colors } = config
    const { vertices, faces } = solidData

    if (error) {
      throw error
    }
    // TODO implement highlighting
    // console.log('highlight faces', highlightFaceIndices)
    return (
      <shape ref={shape => (this.shape = shape)}>
        <appearance>
          <material transparency={1 - opacity} />
        </appearance>
        <indexedfaceset
          solid="false"
          colorPerVertex="false"
          colorindex={faces.map((face, index) => getColorIndex(face)).join(' ')}
          coordindex={joinListOfLists(faces, ' -1 ', ' ')}
        >
          <Coordinates points={vertices} />
          <color color={getColorAttr(colors)} />
        </indexedfaceset>
      </shape>
    )
  }

  handleMouseDown = () => {
    // logic to ensure drags aren't registered as clicks
    this.drag = false
  }

  handleMouseUp = () => {
    if (this.drag) return
    const { operation, options, solidData, applyOperation } = this.props
    const { applyArgs } = this.state

    if (operation && !_.isNil(applyArgs)) {
      applyOperation(operation, solidData, { ...applyArgs, ...options })
    }
  }

  handleMove = event => {
    this.drag = true
    const { solidData, operation } = this.props
    console.log('operation', operation)
    switch (operation) {
      case '+':
        console.log('doing an augment')
        const fIndex = getAugmentFace(solidData, event.hitPnt)
        console.log(fIndex)
        this.setState({
          applyArgs: fIndex === -1 ? null : { fIndex },
        })
        return
      case '-':
      case 'g':
        const vIndices = solidData.findPeak(event.hitPnt, {
          exclude: [operation === 'g' && 'Y'],
        })
        console.log('vIndices', vIndices)
        this.setState({
          applyArgs: vIndices && { vIndices },
        })
        return
      default:
        return
    }
  }
}

const ConnectedFaces = withRouter(
  connect(
    createStructuredSelector({
      operation: getOperation,
      options: getApplyOpts,
    }),
    { applyOperation },
  )(Faces),
)

/* Edges */

const Edges = ({ edges, vertices }) => {
  return (
    <shape>
      <indexedlineset coordindex={joinListOfLists(edges, ' -1 ', ' ')}>
        <Coordinates points={vertices} />
      </indexedlineset>
    </shape>
  )
}

/* Polyhedron */

// const getScaleAttr = scale => `${scale} ${scale} ${scale}`

class Polyhedron extends Component {
  // TODO color
  render() {
    const { config, solidData } = this.props
    const { showEdges, showFaces } = config
    const { vertices, edges } = solidData
    const toggle = 1

    return (
      <Motion
        defaultStyle={{ scale: 0 }}
        style={{ scale: spring(toggle, presets.noWobble) }}
      >
        {({ scale }) => {
          return (
            <transform>
              {showFaces && (
                <ConnectedFaces solidData={solidData} config={config} />
              )}
              {showEdges && <Edges edges={edges} vertices={vertices} />}
            </transform>
          )
        }}
      </Motion>
    )
  }
}

const mapStateToProps = createStructuredSelector({
  config: getPolyhedronConfig,
  solidData: getPolyhedron,
})

export default withRouter(connect(mapStateToProps)(Polyhedron))
