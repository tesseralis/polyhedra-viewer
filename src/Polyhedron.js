import React, { Component, PropTypes } from 'react';

class Polyhedron extends Component {

  static propTypes = {
    solid: PropTypes.object.isRequired
  }

  // TODO move this to a util file
  joinListOfLists(list, outerSep, innerSep) {
    return list.map(elem => elem.join(innerSep)).join(outerSep);
  }

  renderColor(colors) {
    // TODO do actual color
    return (
      <color is color={this.props.solid.faces.map(face => '1 0 0').join(', ')}></color>
    );
  }

  renderCoordinates(points) {
    return (
      <coordinate is point={this.joinListOfLists(points, ', ', ' ')}></coordinate>
    );
  }

  render() {
    return (
      <shape>
        <appearance>
          <material is transparency="0.25"></material>
        </appearance>
        <indexedfaceset is
          colorPerVertex="false"
          coordindex={ this.joinListOfLists(this.props.solid.faces, ' -1 ', ' ') }
        >
          { this.renderCoordinates(this.props.solid.vertices) }
          { this.renderColor() }
        </indexedfaceset>
      </shape>
    );
  }
}

export default Polyhedron
