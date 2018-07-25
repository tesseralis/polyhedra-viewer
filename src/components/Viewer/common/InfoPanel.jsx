// @flow strict
import React from 'react';

import connect from 'components/connect';
import { WithPolyhedron } from 'components/Viewer/context';

function InfoPanel({ solidName, polyhedron }) {
  return (
    <div>
      <p>Name: {solidName}</p>
      <p>Vertices: {polyhedron.numVertices()}</p>
      <p>Edges: {polyhedron.numEdges()}</p>
      <p>Faces: {polyhedron.numFaces()}</p> {/* TODO faces by sides */}
    </div>
  );
}

export default connect(
  WithPolyhedron,
  ['solidName', 'polyhedron'],
)(InfoPanel);
