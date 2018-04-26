// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { VIndex, FIndex } from 'math/solidTypes';

function getExpansionResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'cuboctahedron';
    case 6:
    case 8:
      return 'rhombicuboctahedron';
    case 12:
    case 20:
      return 'rhombicosidodecahedron';
    default:
      throw new Error('Did you try to expand a non-regular solid?');
  }
}

function duplicateVertices(polyhedron: Polyhedron) {
  const newVertexMapping = {};
  const vertexFaces = [];
  let newVertices = polyhedron.vertices;
  _.forEach(polyhedron.vertices, (vertex, vIndex: VIndex) => {
    // For each vertex, pick one adjacent face to be the "head"
    // for every other adjacent face, map it to a duplicated vertex
    const [head, ...tail] = polyhedron.directedAdjacentFaceIndices(vIndex);
    const start = newVertices.length;
    _.set(newVertexMapping, [head, vIndex], vIndex);
    _.forEach(tail, (fIndex, i) => {
      _.set(newVertexMapping, [fIndex, vIndex], start + i);
    });
    vertexFaces.push([vIndex, ..._.range(start, start + tail.length)]);
    newVertices = newVertices.concat(
      _.times(tail.length, () => polyhedron.vertices[vIndex]),
    );
  });

  const remappedOriginalFaces = polyhedron.faces.map((face, fIndex) => {
    return face.map(vIndex => {
      return newVertexMapping[fIndex][vIndex];
    });
  });

  // Create a square out of each edge originally in the polyhedron
  const edgeFaces = polyhedron.edges.map(edge => {
    const [v1, v2] = edge;
    const [f1, f2] = polyhedron.edgeFaceIndices(edge);
    return [
      newVertexMapping[f1][v1],
      newVertexMapping[f1][v2],
      newVertexMapping[f2][v2],
      newVertexMapping[f2][v1],
    ];
  });
  return Polyhedron.of(
    newVertices,
    _.concat(vertexFaces, edgeFaces, remappedOriginalFaces),
  );
}

export function expand(polyhedron: Polyhedron) {
  // figure out what this polyhedron expands to
  const resultName = getExpansionResult(polyhedron);
  // const result = Polyhedron.get(resultName);
  const result = duplicateVertices(polyhedron);
  console.log(result);

  // align the faces with the result

  // calculate how far you need to extend the location

  // add new faces for each vertex and edge

  // determine the mock and unmocked locations
  return result;
}
