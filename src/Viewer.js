import React from 'react';
import Polyhedron from './Polyhedron';
import ViewerMenu from './ViewerMenu';
import X3dScene from './X3dScene';
import { getSolidData } from './data';

const Viewer = ({ params }) => {
  const solidName = params.solid || 'tetrahedron';
  const solid = getSolidData(solidName);

  return (
    <div>
      <ViewerMenu />
      <X3dScene>
        <Polyhedron solid={solid}/>
      </X3dScene>
    </div>
  );
};

export default Viewer;
