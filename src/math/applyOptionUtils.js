// @flow
import _ from 'lodash';
import { getSingle } from 'util.js';
import { getDirectedEdges, numSides } from 'math/solidUtils';
import type { FIndex } from 'math/solidTypes';
import Peak from 'math/Peak';
import Polyhedron from 'math/Polyhedron';

// Get what kind of base we are augmenting to
function faceDistanceBetweenVertices(
  polyhedron,
  vIndices1,
  vIndices2,
  exclude = [],
) {
  const v2fGraph = polyhedron.vertexToFaceGraph();
  let foundVertexIndices = vIndices1;
  let distance = 0;
  while (_.intersection(foundVertexIndices, vIndices2).length === 0) {
    foundVertexIndices = _(foundVertexIndices)
      .flatMap(vIndex => v2fGraph[vIndex])
      .map(fIndex => polyhedron.faces[fIndex])
      .filter(face => !_.includes(exclude, numSides(face)))
      .flatten()
      .uniq()
      .value();
    distance++;

    if (distance > 10) {
      throw new Error('Reached some unreachable state');
    }
  }
  return distance;
}

// Return "meta" or "para", or null
export function getAugmentAlignment(polyhedron: Polyhedron, fIndex: FIndex) {
  // get the existing peak boundary
  const peakBoundary = getSingle(polyhedron.peaks()).boundary();
  const isHexagonalPrism = _.some(
    polyhedron.faces,
    face => numSides(face) === 6,
  );

  // calculate the face distance to the peak's boundary
  return faceDistanceBetweenVertices(
    polyhedron,
    polyhedron.faces[fIndex],
    peakBoundary,
    [isHexagonalPrism && 6],
  ) > 1
    ? 'para'
    : 'meta';
}

export function getPeakAlignment(polyhedron: Polyhedron, peak: Peak) {
  const peakBoundary = peak.boundary();

  const isRhombicosidodecahedron = peak.type === 'cupola';

  const orthoIndices = isRhombicosidodecahedron
    ? _.filter(
        Peak.getAll(polyhedron),
        peak => getCupolaGyrate(polyhedron, peak) === 'ortho',
      )
    : [];
  const diminishedIndices =
    orthoIndices.length > 0
      ? getSingle(orthoIndices).boundary()
      : _.maxBy(polyhedron.faces, numSides);

  return faceDistanceBetweenVertices(
    polyhedron,
    diminishedIndices,
    peakBoundary,
  ) >= (isRhombicosidodecahedron ? 2 : 1)
    ? 'para'
    : 'meta';
}

export function getCupolaGyrate(polyhedron: Polyhedron, peak: Peak) {
  const boundary = peak.boundary();
  const isOrtho = _.every(getDirectedEdges(boundary), edge => {
    const [n1, n2] = polyhedron.faces
      .filter(face => _.intersection(face, edge).length === 2)
      .map(numSides);
    return (n1 === 4) === (n2 === 4);
  });
  return isOrtho ? 'ortho' : 'gyro';
}

export function getGyrateDirection(polyhedron: Polyhedron, peak: Peak) {
  return getCupolaGyrate(polyhedron, peak) === 'ortho' ? 'back' : 'forward';
}
