import React, { Component } from 'react'
import { Motion, spring, presets } from 'react-motion'
import { rgb } from 'd3-color'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { withRouter } from 'react-router-dom'

import polygons from 'constants/polygons'
import { escapeName, unescapeName } from 'constants/polyhedra'
import { getNextPolyhedron, hasOperation } from 'constants/relations'
import { getPolyhedron, getPolyhedronConfig, getMode } from 'selectors'
import { setMode, setPolyhedron, applyOperation } from 'actions'
import { mapObject } from 'util.js'
import { getEdges, getAugmentFace, getPyramidOrCupola } from 'math/operations'

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
  }

  componentDidMount() {
    this.drag = false
    // TODO make sure this doesn't have a race condition
    document.onload = _.once(() => {
      this.shape.addEventListener('mousedown', () => {
        this.drag = false
      })
      this.shape.addEventListener('mouseup', () => {
        // it's a drag, don't click
        if (this.drag) return
        const { mode, setMode, applyOperation, solid, history } = this.props
        const { applyArgs } = this.state
        if (mode && !_.isNil(applyArgs)) {
          const next = getNextPolyhedron(unescapeName(solid), mode)
          history.push(`/${escapeName(next)}/related`)
          applyOperation(mode, { ...applyArgs, name: solid })

          // Get out of current mode if we can't do it any more
          if (!hasOperation(next, mode)) {
            setMode(null)
          }
        }
      })

      this.shape.addEventListener(
        'mousemove',
        _.throttle(event => {
          this.drag = true
          const { faces, vertices, mode } = this.props
          switch (mode) {
            case '+':
              const fIndex = getAugmentFace({ vertices, faces }, event.hitPnt)
              console.log('setting fIndex to', fIndex)
              this.setState({
                applyArgs: fIndex === -1 ? null : { fIndex },
              })
              return
            case '-':
            case 'g':
              const vIndices = getPyramidOrCupola(
                { vertices, faces },
                event.hitPnt,
                { pyramids: mode === '-' },
              )
              this.setState({
                applyArgs: vIndices && { vIndices },
              })
              return

            default:
              return
          }
        }, 200),
        false,
      )
    })
  }

  render() {
    const { faces, vertices, config } = this.props
    const { highlightFaceIndices } = this.state
    const { opacity, colors } = config
    // FIXME highlights don't work
    // console.log('highlight faces', highlightFaceIndices)
    return (
      <shape ref={shape => (this.shape = shape)}>
        <appearance>
          <material transparency={1 - opacity} />
        </appearance>
        <indexedfaceset
          solid="false"
          colorPerVertex="false"
          colorindex={faces
            .map(
              (face, index) =>
                false && _.includes(highlightFaceIndices, index)
                  ? 6
                  : getColorIndex(face),
            )
            .join(' ')}
          coordindex={joinListOfLists(faces, ' -1 ', ' ')}
        >
          <Coordinates points={vertices} />
          <color color={getColorAttr(colors)} />
        </indexedfaceset>
      </shape>
    )
  }
}

const ConnectedFaces = withRouter(
  connect(createStructuredSelector({ mode: getMode }), {
    applyOperation,
    setMode,
  })(Faces),
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
// get the edges associated with the given faces
function getAllEdges(faces) {
  return _.uniqWith(_.flatMap(faces, getEdges), _.isEqual)
}

class Polyhedron extends Component {
  // TODO make sure this is stable
  componentDidMount() {
    const { solid, onLoad } = this.props
    onLoad(solid)
  }

  // TODO color
  render() {
    const { solid, config, solidData } = this.props
    const { showEdges, showFaces } = config
    const { faces, vertices } = solidData
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
                <ConnectedFaces
                  faces={faces}
                  vertices={vertices}
                  config={config}
                  solid={solid}
                />
              )}
              {showEdges && (
                <Edges edges={getAllEdges(faces)} vertices={vertices} />
              )}
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

const mapDispatchToProps = {
  onLoad: setPolyhedron,
}

export default connect(mapStateToProps, mapDispatchToProps)(Polyhedron)
