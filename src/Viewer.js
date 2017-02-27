import React from 'react';
// TODO don't rely on this syntax and put this in the webpack config
// (do this once we've ejected from create-react-app
import x3dom from 'exports?x3dom!x3dom'; // eslint-disable-line import/no-webpack-loader-syntax
import 'x3dom/x3dom.css';
import './Viewer.css';
import Polyhedron from './Polyhedron';
import Sidebar from './Sidebar';
import polyhedra from './data/polyhedra.json';
import _ from 'lodash';

// TODO replace this logic with normalized data
const normalizedPolyhedra = _(polyhedra.groups)
  .flatMap(group => group.polyhedra)
  .map(polyhedron => [polyhedron.name.replace(/ /g, '-'), polyhedron])
  .fromPairs()
  .value();

class Viewer extends React.Component {
  componentDidMount() {
    // Reload X3DOM so that it tracks the re-created instance
    x3dom.reload();
  }
  render() {
    const solidName = this.props.params.solid || 'tetrahedron';
    const solid = normalizedPolyhedra[solidName];

    return (
      <div className="Viewer">
        <Sidebar polyhedra={polyhedra}/>
        <x3d className="X3d">
          <scene>
            <viewpoint is position="0,0,5"></viewpoint>
            <Polyhedron solid={solid}/>
          </scene>
        </x3d>
      </div>
    );
  }
}

export default Viewer;
