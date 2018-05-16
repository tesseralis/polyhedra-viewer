// @flow
import _ from 'lodash';
import { getSingle, getCyclic } from 'util.js';
import { Peak, Polyhedron, Edge } from 'math/polyhedra';
import { getNormal, PRECISION } from 'math/linAlg';

export function getPeakAlignment(polyhedron: Polyhedron, peak: Peak) {
  const peakNormal = getNormal(peak.boundaryVectors());

  const isRhombicosidodecahedron = peak.type === 'cupola';
  const orthoPeaks = isRhombicosidodecahedron
    ? _.filter(
        Peak.getAll(polyhedron),
        peak => getCupolaGyrate(polyhedron, peak) === 'ortho',
      )
    : [];

  const otherNormal =
    orthoPeaks.length > 0
      ? getNormal(getSingle(orthoPeaks).boundaryVectors())
      : polyhedron.largestFace().normal();

  const isParallel = Math.abs(peakNormal.dot(otherNormal) + 1) < PRECISION;
  return isParallel ? 'para' : 'meta';
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
