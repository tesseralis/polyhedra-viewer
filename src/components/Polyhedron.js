import React from 'react'
import { Motion, spring, presets } from 'react-motion'
import { rgb } from 'd3-color'
import _ from 'lodash'

import { mapObject } from '../util'
import polygons from '../constants/polygons'

// Join a list of lists with an inner and outer separator.
export const joinListOfLists = (list, outerSep, innerSep) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep)
}

const Coordinates = ({ points }) => {
  // TODO Find a more elegant solution for this
  // We pad the number of points in case we move from a solid with more vertices
  // to one with less, so that x3dom does accidentally map an index to a non-existing point
  const buffer = _.times(100, _.constant([0, 0, 0]))
  const bufferedPoints = points.concat(buffer)

  return (
    <coordinate is point={joinListOfLists(bufferedPoints, ', ', ' ')}></coordinate>
  )
}

/* Faces */

// Convert the hex color to RGB
const toRgb = hex => ['r', 'g', 'b'].map(_.propertyOf(rgb(hex))).map(d => d/255)
const colorIndexForFace = mapObject(polygons, _.nthArg(1))
const getColorIndex = face => colorIndexForFace[face.length]
const polygonColors = colors => polygons.map(n => toRgb(colors[n]))
const getColorAttr = colors => joinListOfLists(polygonColors(colors), ',', ' ')

const Faces = ({ faces, vertices, config }) => {
  const { opacity, colors } = config
  return (
    <shape>
      <appearance>
        <material is transparency={1 - opacity}></material>
      </appearance>
      <indexedfaceset is
        solid="false"
        colorPerVertex="false"
        colorindex={ faces.map(getColorIndex).join(' ') }
        coordindex={ joinListOfLists(faces, ' -1 ', ' ') }
      >
        <Coordinates points={vertices} />
        <color is color={getColorAttr(colors)}></color>
      </indexedfaceset>
    </shape>
  )
  
}

/* Edges */

const Edges = ({ edges, vertices }) => {
  return (
    <shape>
      <indexedlineset is
        coordindex={ joinListOfLists(edges, ' -1 ', ' ') }
      >
      <Coordinates points={vertices} />
      </indexedlineset>
    </shape>
  )
}

/* Polyhedron */

const getScaleAttr = scale => `${scale} ${scale} ${scale}`

const Polyhedron = ({ solid, config }) => {
  const { faces, vertices, edges } = solid
  const { showEdges, showFaces } = config

  return (
    <Motion defaultStyle={{ scale: 0 }} style={{ scale: spring(1, presets.gentle) }}>
      { ({ scale }) =>
        <transform is scale={getScaleAttr(scale)}>
          { showFaces && <Faces faces={faces} vertices={vertices} config={config} /> }
          { showEdges && <Edges edges={edges} vertices={vertices} /> }
        </transform>
      }
    </Motion>
  )
}

export default Polyhedron
