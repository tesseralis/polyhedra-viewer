import React, { Component } from 'react'
import { Motion, spring, presets } from 'react-motion'
import { rgb } from 'd3-color'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { withRouter } from 'react-router-dom'
import { geom } from 'toxiclibsjs'

import polygons from 'constants/polygons'
import {
  escapeName,
  unescapeName,
  toConwayNotation,
  fromConwayNotation,
} from 'constants/polyhedra'
import { polyhedraGraph } from 'constants/relations'
import { getPolyhedron, getPolyhedronConfig, getMode } from 'selectors'
import { setPolyhedron, applyOperation } from 'actions'
import { mapObject } from 'util.js'
import { getAdjacentFacesMapping, getCupolae } from 'math/operations'

const { Vec3D, Triangle3D, Plane } = geom

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

function getPlane(face, vertices) {
  const triang = _.take(face, 3).map(vIndex => new Vec3D(...vertices[vIndex]))
  return new Plane(new Triangle3D(...triang))
}

class Faces extends Component {
  state = {
    highlightFaceIndices: [],
    applyFaceIndex: null,
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
        const { mode, applyOperation, solid, history } = this.props
        const { applyFaceIndex } = this.state
        console.log(solid)
        if (mode && !_.isNil(applyFaceIndex)) {
          const next =
            polyhedraGraph[toConwayNotation(unescapeName(solid))]['g']
          console.log('next', next)
          if (next.length > 1) {
            throw new Error(
              'Cannot deal with more than one possibility right now',
            )
          }
          history.push(`/${escapeName(fromConwayNotation(next[0]))}/related`)
          applyOperation(mode, { fIndex: applyFaceIndex })
        }
      })

      this.shape.addEventListener(
        'mousemove',
        _.throttle(event => {
          this.drag = true
          const { faces, vertices, mode } = this.props
          if (!mode) return
          const hitPoint = new Vec3D(...event.hitPnt)
          const hitFaceIndex = _.minBy(_.range(faces.length), fIndex => {
            const face = faces[fIndex]
            const plane = getPlane(face, vertices)
            return plane.distanceTo(hitPoint)
          })

          if (mode === 'g') {
            // FIXME probably can move this logic out once we know the hit index...
            // find out if we're in a cupola
            const cupolae = getCupolae({ faces, vertices })
            // TODO this is called in "getCupolae", so it's a bit of a waste
            const adjacentFacesMapping = getAdjacentFacesMapping({
              faces,
              vertices,
            })

            const cupolaeFaces = _.flatMapDeep(cupolae, cupola =>
              _.map(cupola, vIndex => adjacentFacesMapping[vIndex]),
            )

            // check if we're inside a cupola
            if (!_.includes(cupolaeFaces, hitFaceIndex)) {
              // console.log(' we are not in a cupola so we cannot rotate')
              this.setState({
                highlightFaceIndices: [],
                applyFaceIndex: null,
              })
              return
            }
            // if so, determine the closest cupola point to this
            // console.log('finding nearest cupola peak...')
            const nearestPeak = _.minBy(cupolae, face => {
              const plane = getPlane(face, vertices)
              return plane.distanceTo(hitPoint)
            })

            // TODO have the cupolae function return the face instead
            const fIndexToGyrate = _.findIndex(faces, face =>
              _.isEqual(face, nearestPeak),
            )

            this.setState({
              highlightFaceIndices: _.uniq(
                _.flatMap(nearestPeak, vIndex => adjacentFacesMapping[vIndex]),
              ),
              applyFaceIndex: fIndexToGyrate,
            })

            // console.log('touching face at index', hitFaceIndex)
            // console.log('touching cupola peak', fIndexToGyrate)
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

// function getVertices(vertices, morphVertices, scale) {
//   return _.zip(vertices, morphVertices).map(([v1, v2]) => {
//     const _v1 = new Vec3D(...v1)
//     const _v2 = new Vec3D(...v2)
//     return _v1.add(_v2.sub(_v1).scale(scale)).toArray()
//   })
// }

/* Polyhedron */

// const getScaleAttr = scale => `${scale} ${scale} ${scale}`

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
    const { faces, edges, vertices } = solidData
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

const mapDispatchToProps = {
  onLoad: setPolyhedron,
}

export default connect(mapStateToProps, mapDispatchToProps)(Polyhedron)
