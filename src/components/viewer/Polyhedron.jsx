import React, { Component } from 'react'
import { Motion, spring, presets } from 'react-motion'
import { rgb } from 'd3-color'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'

import polygons from 'constants/polygons'
import { getPolyhedron, getPolyhedronConfig, getMode } from 'selectors'
import { setPolyhedron } from 'actions'
import { mapObject } from 'util.js'
import { geom } from 'toxiclibsjs'

const { Vec3D } = geom

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
const getColorAttr = colors => joinListOfLists(polygonColors(colors), ',', ' ')

class Faces extends Component {
  componentDidMount() {
    // TODO make sure this doesn't have a race condition
    window.onLoad = () => {
      this.shape.addEventListener(
        'click',
        event => {
          console.log(event.hitPnt)
        },
        false,
      )
    }
  }

  render() {
    const { faces, vertices, config } = this.props
    const { opacity, colors } = config
    return (
      <shape ref={shape => (this.shape = shape)}>
        <appearance>
          <material transparency={1 - opacity} />
        </appearance>
        <indexedfaceset
          solid="false"
          colorPerVertex="false"
          colorindex={faces.map(getColorIndex).join(' ')}
          coordindex={joinListOfLists(faces, ' -1 ', ' ')}
        >
          <Coordinates points={vertices} />
          <color color={getColorAttr(colors)} />
        </indexedfaceset>
      </shape>
    )
  }
}

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
    const { config, solidData } = this.props
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
                <Faces faces={faces} vertices={vertices} config={config} />
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
  mode: getMode,
})

const mapDispatchToProps = {
  onLoad: setPolyhedron,
}

export default connect(mapStateToProps, mapDispatchToProps)(Polyhedron)
