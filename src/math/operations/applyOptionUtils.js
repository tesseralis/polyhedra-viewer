// @flow
import _ from 'lodash';
import { getSingle, getCyclic } from 'util.js';
import { Peak, Polyhedron, Vertex, Edge } from 'math/polyhedra';

/** Return the minimum number of faces between the given sets of vertices */
export function faceDistanceBetweenVertices(
  polyhedron: Polyhedron,
  vertices1: Vertex[],
  vertices2: Vertex[],
  exclude: number[] = [],
) {
  let foundVertices = vertices1;
  let distance = 0;
  while (
    _.intersection(_.map(foundVertices, 'index'), _.map(vertices2, 'index'))
      .length === 0
  ) {
    foundVertices = _(foundVertices)
      .flatMap(vertex => vertex.adjacentFaces())
      .filter(face => !_.includes(exclude, face.numSides))
      .map('vertices')
      .flatten()
      .uniqBy('index')
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

  const orthoPeaks = isRhombicosidodecahedron
    ? _.filter(
        Peak.getAll(polyhedron),
        peak => getCupolaGyrate(polyhedron, peak) === 'ortho',
      )
    : [];

  const diminishedVertices =
    orthoPeaks.length > 0
      ? getSingle(orthoPeaks).boundary()
      : polyhedron.largestFace().vertices;

  return faceDistanceBetweenVertices(
    polyhedron,
    diminishedVertices,
    peakBoundary,
  ) >= (isRhombicosidodecahedron ? 2 : 1)
    ? 'para'
    : 'meta';
}

function getCyclicPairs<T>(array: T[]) {
  return _.map(array, (item, index) => {
    return [item, getCyclic(array, index + 1)];
  });
}

export function getCupolaGyrate(polyhedron: Polyhedron, peak: Peak) {
  const boundary = peak.boundary();
  const isOrtho = _.every(getCyclicPairs(boundary), vPair => {
    const edge = new Edge(...vPair);
    const [n1, n2] = _.map(edge.adjacentFaces(), 'numSides');
    return (n1 === 4) === (n2 === 4);
  });
  return isOrtho ? 'ortho' : 'gyro';
}

export function getGyrateDirection(polyhedron: Polyhedron, peak: Peak) {
  return getCupolaGyrate(polyhedron, peak) === 'ortho' ? 'back' : 'forward';
}
