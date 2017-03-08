import React, { Component, PropTypes } from 'react'
import { rgb } from 'd3-color'
import { schemeSet1 } from 'd3-scale-chromatic'
import _ from 'lodash'
import { joinListOfLists } from './util'

// Convert the hex color to RGB
const toRgb = hex => {
  const asRgb = rgb(hex)
  return [asRgb.r, asRgb.g, asRgb.b].map(d => d/255)
}

const colors = schemeSet1.map(color => toRgb(color))
const colorAttr = joinListOfLists(colors, ', ', ' ')
const colorMap = { 3: 4, 4: 0, 5: 1, 6: 2, 8: 3, 10: 6 }

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
    const { faces, vertices, edges } = this.props.solid
    const { showEdges, showFaces, opacity } = this.props.config
    // FIXME line width just doesn't work!

    return (
      <group>
        { showFaces && <shape>
          <appearance>
            <material is transparency={1 - opacity}></material>
          </appearance>
          <indexedfaceset is
            solid="false"
            colorPerVertex="false"
            colorindex={ faces.map(face => colorMap[face.length]).join(' ') }
            coordindex={ joinListOfLists(faces, ' -1 ', ' ') }
          >
            { this.renderCoordinates(vertices) }
            <color is color={colorAttr}></color>
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
