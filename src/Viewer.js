import React from 'react';
import Polyhedron from './Polyhedron';
import Sidebar from './Sidebar';
import X3dScene from './X3dScene';
import polyhedra from './data/polyhedra.json';
import _ from 'lodash';

// TODO replace this logic with normalized data
const normalizedPolyhedra = _(polyhedra.groups)
  .flatMap(group => group.polyhedra)
  .map(polyhedron => [polyhedron.name.replace(/ /g, '-'), polyhedron])
  .fromPairs()
  .value();

const Viewer = ({ params }) => {
  const solidName = params.solid || 'tetrahedron';
  const solid = normalizedPolyhedra[solidName];

  return (
    <div className="Viewer">
      <Sidebar polyhedra={polyhedra}/>
      <X3dScene>
        <Polyhedron solid={solid}/>
      </X3dScene>
    </div>
  );
};

export default Viewer;
