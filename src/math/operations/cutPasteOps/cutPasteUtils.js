// @flow strict
import _ from 'lodash';
import { getSingle } from 'util.js';
import { Peak, Polyhedron } from 'math/polyhedra';
import { isInverse } from 'math/linAlg';
import type { Relation } from '../operationTypes';

export const hasMultiple = (relations: ?(Relation[]), property: string) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

export function getPeakAlignment(polyhedron: Polyhedron, peak: Peak) {
  const isRhombicosidodecahedron = peak.type === 'cupola';
  const orthoPeaks = isRhombicosidodecahedron
    ? _.filter(
        Peak.getAll(polyhedron),
        peak => getCupolaGyrate(polyhedron, peak) === 'ortho',
      )
    : [];

  const otherNormal =
    orthoPeaks.length > 0
      ? getSingle(orthoPeaks)
          .boundary()
          .normal()
      : polyhedron.largestFace().normal();

  return isInverse(peak.normal(), otherNormal) ? 'para' : 'meta';
}

export function getCupolaGyrate(polyhedron: Polyhedron, peak: Peak) {
  const isOrtho = _.every(peak.boundary().edges, edge => {
    const [n1, n2] = _.map(edge.adjacentFaces(), 'numSides');
    return (n1 === 4) === (n2 === 4);
  });
  return isOrtho ? 'ortho' : 'gyro';
}

export function getGyrateDirection(polyhedron: Polyhedron, peak: Peak) {
  return getCupolaGyrate(polyhedron, peak) === 'ortho' ? 'back' : 'forward';
}
