import React, { Component, PropTypes } from 'react';
import { rgb } from 'd3-color';
import { schemeSet1 } from 'd3-scale-chromatic';

// TODO move this to a util file
const joinListOfLists = (list, outerSep, innerSep) => {
  return list.map(elem => elem.join(innerSep)).join(outerSep);
}

const toRgb = hex => {
  const asRgb = rgb(hex);
  return [asRgb.r, asRgb.g, asRgb.b].map(d => d/255);
};

const colors = schemeSet1.map(color => toRgb(color));
const colorAttr = joinListOfLists(colors, ', ', ' ');
const colorMap = { 3: 4, 4: 0, 5: 1, 6: 2, 8: 3, 10: 6 };

class Polyhedron extends Component {

  static propTypes = {
    solid: PropTypes.object.isRequired
  }

  renderCoordinates(points) {
    return (
      <coordinate is point={joinListOfLists(points, ', ', ' ')}></coordinate>
    );
  }

  render() {
    const { faces, vertices, edges } = this.props.solid;

    return (
      <group>
        <shape>
          <appearance>
            <material is transparency="0.1"></material>
          </appearance>
          <indexedfaceset is
            colorPerVertex="false"
            colorindex={ faces.map(face => colorMap[face.length]).join(' ') }
            coordindex={ joinListOfLists(faces, ' -1 ', ' ') }
          >
            { this.renderCoordinates(vertices) }
            <color is color={colorAttr}></color>
          </indexedfaceset>
        </shape>
        <shape>
          <indexedlineset is
            coordindex={ joinListOfLists(edges, ' -1 ', ' ') }
          >
            { this.renderCoordinates(vertices) }
          </indexedlineset>
        </shape>
      </group>
    );
  }
}

export default Polyhedron
