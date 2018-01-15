import React from 'react'
import { Motion, spring, presets } from 'react-motion'
import { rgb } from 'd3-color'
import _ from 'lodash'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { getTruncated } from 'math/operations'

import { getPolyhedronConfig } from 'selectors'
import { mapObject } from 'util.js'
import polygons from 'constants/polygons'
// FIXME replace this with toxi
import { Vector3 } from 'three'

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

const Faces = ({ faces, vertices, config }) => {
  const { opacity, colors } = config
  return (
    <shape>
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

function getVertices(vertices, morphVertices, scale) {
  return _.zip(vertices, morphVertices).map(([v1, v2]) => {
    const _v1 = new Vector3(...v1)
    const _v2 = new Vector3(...v2)
    return _v1.add(_v2.sub(_v1).multiplyScalar(scale)).toArray()
  })
}

/* Polyhedron */

const getScaleAttr = scale => `${scale} ${scale} ${scale}`

const Polyhedron = ({ solid, config }) => {
  const { faces, vertices, edges } = getTruncated(solid, 0)
  const morphVertices = getTruncated(solid, 1).vertices
  const { showEdges, showFaces } = config

  return (
    <Motion
      defaultStyle={{ scale: 0 }}
      style={{ scale: spring(1, presets.gentle) }}
    >
      {({ scale }) => (
        <transform scale={getScaleAttr(1)}>
          {showFaces && (
            <Faces
              faces={faces}
              vertices={getVertices(vertices, morphVertices, scale)}
              config={config}
            />
          )}
          {false && showEdges && <Edges edges={edges} vertices={vertices} />}
        </transform>
      )}
    </Motion>
  )
}

const mapStateToProps = createStructuredSelector({
  config: getPolyhedronConfig,
})

export default connect(mapStateToProps)(Polyhedron)
