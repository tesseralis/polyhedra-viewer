import React, { Component } from 'react'
import { rgb } from 'd3-color'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import EventListener from 'react-event-listener'

import polygons from 'constants/polygons'
import { getPolyhedron } from 'selectors'
import { mapObject } from 'util.js'
import { getAugmentFace } from 'math/operations'
import polyhedraViewer from 'containers/polyhedraViewer'
import { WithConfig } from './sidebar'
import Transition from './Transition'

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
const colorIndexForFace = mapObject(polygons, (n, i) => [n, i])
const getColorIndex = face => colorIndexForFace[face.length]
const polygonColors = colors => polygons.map(n => toRgb(colors[n]))

class Faces extends Component {
  state = {
    applyArgs: {},
    error: null,
  }

  render() {
    const { solidData, config } = this.props
    const { error } = this.state
    const { opacity } = config
    const { vertices, faces } = solidData

    if (error) {
      throw error
    }
    // NOTE: The mouse handlers are duplicated to make it easy to test on enzyme.
    // They don't actually do anything in production
    return (
      <shape
        ref={shape => (this.shape = shape)}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onMouseOut={this.handleMouseOut}
      >
        <EventListener target="document" onLoad={_.once(this.handleLoad)} />
        <appearance>
          <material transparency={1 - opacity} />
        </appearance>
        <indexedfaceset
          solid="true"
          colorpervertex="false"
          coordindex={joinListOfLists(faces, ' -1 ', ' ')}
        >
          <Coordinates points={vertices} />
          <color color={this.getColors()} />
        </indexedfaceset>
      </shape>
    )
  }

  getColorForFace = (face, fIndex) => {
    const { applyArgs } = this.state
    const { config: { colors } } = this.props
    const defaultColors = polygonColors(colors)

    // TODO pick better colors / have better effects
    if (_.isNumber(applyArgs.fIndex) && fIndex === applyArgs.fIndex) {
      return [0, 1, 0]
    }
    if (
      _.isObject(applyArgs.peak) &&
      _.includes(applyArgs.peak.faceIndices(), fIndex)
    ) {
      return [1, 1, 0]
    }
    return defaultColors[getColorIndex(face)]
  }

  getColors = () => {
    const { solidData: { faces } } = this.props
    return joinListOfLists(faces.map(this.getColorForFace), ',', ' ')
  }

  // Manually adding event listeners swallows errors, so we have to store it in the component itself
  wrapError = fn => event => {
    try {
      fn(event)
    } catch (error) {
      this.setState({ error })
    }
  }

  addEventListener(type, fn) {
    this.shape.addEventListener(type, this.wrapError(fn))
  }

  handleLoad = () => {
    this.addEventListener('mousedown', this.handleMouseDown)
    this.addEventListener('mouseup', this.handleMouseUp)
    this.addEventListener('mousemove', this.handleMouseMove)
    this.addEventListener('mouseout', this.handleMouseOut)
  }

  handleMouseDown = () => {
    // logic to ensure drags aren't registered as clicks
    this.drag = false
  }

  handleMouseUp = () => {
    if (this.drag) return
    const { operation, applyOperation } = this.props
    const { applyArgs } = this.state

    if (operation && !_.isEmpty(applyArgs)) {
      applyOperation(operation, applyArgs)
      // prevent the operation from doing something else
      if (operation !== 'g') {
        this.setState({ applyArgs: {} })
      }
    }
  }

  handleMouseMove = event => {
    // TODO replace this with logs
    this.drag = true
    const { solidData, operation, augmentInfo } = this.props
    console.log('operation', operation)
    switch (operation) {
      case '+':
        const fIndex = getAugmentFace(solidData, augmentInfo, event.hitPnt)
        console.log('fIndex', fIndex)
        this.setState({
          applyArgs: fIndex === -1 ? {} : { fIndex },
        })
        // TODO what is this for?
        this.forceUpdate()
        return
      case '-':
      case 'g':
        const peak = solidData.findPeak(event.hitPnt)
        console.log('peak', peak && peak.innerVertexIndices())
        this.setState({
          applyArgs: peak ? { peak } : {},
        })
        return
      default:
        return
    }
  }

  handleMouseOut = () => {
    this.setState({ applyArgs: {} })
  }
}

const ConnectedFaces = polyhedraViewer(Faces)

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
  constructor(props) {
    super(props)
    this.state = {
      solidData: props.solidData,
      animate: false,
    }
  }

  render() {
    const { config } = this.props
    const { solidData, animate } = this.state
    const { vertices, edges } = solidData

    // FIXME After the transition is finished, the new polyhedron can't receive events
    // because of an unmounting issue

    // TODO different eases for different animations?
    return (
      <WithConfig>
        {config => (
          <transform>
            {config.showFaces && (
              <ConnectedFaces solidData={solidData} config={config} />
            )}
            {config.showEdges && <Edges edges={edges} vertices={vertices} />}
          </transform>
        )}
      </WithConfig>
    )
    // if (animate) {
    //   return (
    //     <Transition
    //       defaultStyle={{ vertices: solidData.vertices }}
    //       style={{ vertices: this.props.solidData.vertices }}
    //       duration={750}
    //       ease="easePolyOut"
    //       onFinish={() =>
    //         this.setState({ animation: false, solidData: this.props.solidData })
    //       }
    //     >
    //       {({ vertices }) => {
    //         return (
    //           <transform>
    //             {showFaces && (
    //               <ConnectedFaces
    //                 solidData={solidData.withVertices(vertices)}
    //                 config={config}
    //               />
    //             )}
    //             {showEdges && <Edges edges={edges} vertices={vertices} />}
    //           </transform>
    //         )
    //       }}
    //     </Transition>
    //   )
    // } else {
    //   return (
    //     <transform>
    //       {showFaces && (
    //         <ConnectedFaces solidData={solidData} config={config} />
    //       )}
    //       {showEdges && <Edges edges={edges} vertices={vertices} />}
    //     </transform>
    //   )
    // }
  }

  componentWillReceiveProps(nextProps) {
    // FIXME handle the case where vertices are removed after animation
    if (nextProps.solidData !== this.props.solidData) {
      const { solidData } = nextProps
      if (solidData.mock) {
        this.setState({ solidData: solidData.mock, animate: true })
      } else {
        this.setState({ solidData, animate: false })
      }
    }
  }
}

const mapStateToProps = createStructuredSelector({
  solidData: getPolyhedron,
})

export default connect(mapStateToProps)(Polyhedron)
