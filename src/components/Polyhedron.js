import React, { Component, PropTypes } from 'react'
import { rgb } from 'd3-color'
import _ from 'lodash'

import { mapObject } from '../util'
import polygons from '../constants/polygons'

// Join a list of lists with an inner and outer separator.
export const joinListOfLists = (list, outerSep, innerSep) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep)
}

// Convert the hex color to RGB
const toRgb = hex => {
  const asRgb = rgb(hex)
  return [asRgb.r, asRgb.g, asRgb.b].map(d => d/255)
}

const colorIndexForFace = mapObject(polygons, _.nthArg(1))

const getColorIndex = face => colorIndexForFace[face.length]

const getColorAttr = colors => {
  return joinListOfLists(polygons.map(n => toRgb(colors[n])), ', ', ' ')
}

export default class Polyhedron extends Component {

  static propTypes = {
    solid: PropTypes.object.isRequired,
    config: PropTypes.object.isRequired,
  }

  renderCoordinates(points) {
    // TODO Find a more elegant solution for this
    // We pad the number of points in case we move from a solid with more vertices
    // to one with less, so that x3dom does accidentally map an index to a non-existing point
    const buffer = _.times(100, _.constant([0, 0, 0]))
    const bufferedPoints = points.concat(buffer)

    return (
      <coordinate is point={joinListOfLists(bufferedPoints, ', ', ' ')}></coordinate>
    )
  }

  render() {
    const { solid, config } = this.props
    const { faces, vertices, edges } = solid
    const { showEdges, showFaces, opacity, colors } = config
    // TODO line width doesn't work -- replace with another option

    return (
      <group>
        { showFaces && <shape>
          <appearance>
            <material is transparency={1 - opacity}></material>
          </appearance>
          <indexedfaceset is
            solid="false"
            colorPerVertex="false"
            colorindex={ faces.map(getColorIndex).join(' ') }
            coordindex={ joinListOfLists(faces, ' -1 ', ' ') }
          >
            { this.renderCoordinates(vertices) }
            <color is color={getColorAttr(colors)}></color>
          </indexedfaceset>
        </shape> }
        { showEdges && <shape>
          <indexedlineset is
            coordindex={ joinListOfLists(edges, ' -1 ', ' ') }
          >
            { this.renderCoordinates(vertices) }
          </indexedlineset>
        </shape> }
      </group>
    )
  }
}
