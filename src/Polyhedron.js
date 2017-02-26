import React, { Component, PropTypes } from 'react';
import { rgb } from 'd3-color';
import { schemeSet1 } from 'd3-scale-chromatic';

class Polyhedron extends Component {

  static propTypes = {
    solid: PropTypes.object.isRequired
  }

  // TODO move this to a util file
  joinListOfLists(list, outerSep, innerSep) {
    return list.map(elem => elem.join(innerSep)).join(outerSep);
  }

  getColor(n) {
    const colorMap = { 3: 4, 4: 0, 5: 1, 6: 2, 8: 3, 10: 6 };
    const asRgb = rgb(schemeSet1[colorMap[n]]);
    return [asRgb.r, asRgb.g, asRgb.b].map(d => d/255);
  }

  renderColor(faces) {
    const colorsPerFace = faces.map(face => this.getColor(face.length));
    return (
      <color is color={this.joinListOfLists(colorsPerFace, ', ', ' ')}></color>
    );
  }

  renderCoordinates(points) {
    return (
      <coordinate is point={this.joinListOfLists(points, ', ', ' ')}></coordinate>
    );
  }

  render() {
    const { faces, vertices, edges } = this.props.solid;

    return (
      <transform>
        <shape>
          <appearance>
            <material is transparency="0.25"></material>
          </appearance>
          <indexedfaceset is
            colorPerVertex="false"
            coordindex={ this.joinListOfLists(faces, ' -1 ', ' ') }
          >
            { this.renderCoordinates(vertices) }
            { this.renderColor(faces) }
          </indexedfaceset>
        </shape>
        <shape>
          <indexedlineset is
            coordindex={ this.joinListOfLists(edges, ' -1 ', ' ') }
          >
            { this.renderCoordinates(this.props.solid.vertices) }
          </indexedlineset>
        </shape>
      </transform>
    );
  }
}

export default Polyhedron
