// @flow
import _ from 'lodash';
import { getSingle } from 'util.js';
// FIXME don't rely on these
import { getDirectedEdges, numSides } from 'math/polyhedra/solidUtils';
import type { VIndex } from 'math/polyhedra';
import { Peak, Polyhedron } from 'math/polyhedra';

/** Return the minimum number of faces between the given sets of vertices */
export function faceDistanceBetweenVertices(
  polyhedron: Polyhedron,
  vIndices1: VIndex[],
  vIndices2: VIndex[],
  exclude: number[] = [],
) {
  const v2fGraph = polyhedron.vertexToFaceGraph();
  let foundVertexIndices = vIndices1;
  let distance = 0;
  while (_.intersection(foundVertexIndices, vIndices2).length === 0) {
    foundVertexIndices = _(foundVertexIndices)
      .flatMap(vIndex => v2fGraph[vIndex])
      // .map(fIndex => polyhedron.faces[fIndex])
      .filter(face => !_.includes(exclude, face.numSides()))
      .map(face => face.vIndices())
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
