import React from 'react';
import 'x3dom';
import 'x3dom/x3dom.css';
import './App.css';
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

const App = ({ params }) => {

  const solidName = params.solid || 'tetrahedron';
  const solid = normalizedPolyhedra[solidName];

  return (
    <div className="App">
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

export default App;
