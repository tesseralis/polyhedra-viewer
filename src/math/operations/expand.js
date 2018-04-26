// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { VIndex } from 'math/solidTypes';

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

function isExpansionFace(polyhedron, fIndex, nSides) {
  if (polyhedron.numSides(fIndex) !== nSides) return false;
  return _.every(
    polyhedron.faceGraph()[fIndex],
    fIndex2 => polyhedron.numSides(fIndex2) === 4,
  );
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
  const n = polyhedron.numSides(0);
  const sideLength = polyhedron.edgeLength();
  const result = duplicateVertices(polyhedron);

  // Use a reference polyhedron to calculate how far to expand
  const resultName = getExpansionResult(polyhedron);
  const reference = Polyhedron.get(resultName);
  const referenceFaceIndex = _.find(reference.fIndices(), fIndex =>
    isExpansionFace(reference, fIndex, n),
  );
  // FIXME something is wrong with tetrahedron -> cuboctahedron
  const referenceLength =
    reference.distanceToCenter(referenceFaceIndex) / reference.edgeLength();

  const expandFaceIndices = _.filter(result.fIndices(), fIndex =>
    isExpansionFace(result, fIndex, n),
  );
  const f0 = expandFaceIndices[0];
  const baseLength = result.distanceToCenter(f0) / sideLength;

  // Update the vertices with the expanded-out version
  const endVertices = [...result.vertices];
  _.forEach(expandFaceIndices, fIndex => {
    const normal = result.faceNormal(fIndex);
    const expandFace = result.faces[fIndex];
    _.forEach(expandFace, vIndex => {
      const vertex = result.vertexVectors()[vIndex];
      endVertices[vIndex] = vertex
        .add(normal.scale((referenceLength - baseLength) * sideLength))
        .toArray();
    });
  });

  // FIXME: Expand -> Gyrate breaks!
  return {
    result: result.withVertices(endVertices),
    animationData: {
      start: result,
      endVertices,
    },
  };
}
