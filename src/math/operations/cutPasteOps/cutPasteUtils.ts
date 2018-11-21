import _ from 'lodash';
import { getSingle } from 'utils';
import { Cap, Polyhedron } from 'math/polyhedra';
import { isInverse } from 'math/geom';

type Relation = {};

export const hasMultiple = (relations: Relation[], property: string) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

export function getCapAlignment(polyhedron: Polyhedron, cap: Cap) {
  const isRhombicosidodecahedron = cap.type === 'cupola';
  const orthoCaps = isRhombicosidodecahedron
    ? _.filter(
        Cap.getAll(polyhedron),
        cap => getCupolaGyrate(polyhedron, cap) === 'ortho',
      )
    : [];

  const otherNormal =
    orthoCaps.length > 0
      ? getSingle(orthoCaps)
          .boundary()
          .normal()
      : polyhedron.largestFace().normal();

  return isInverse(cap.normal(), otherNormal) ? 'para' : 'meta';
}

export function getCupolaGyrate(polyhedron: Polyhedron, cap: Cap) {
  const isOrtho = _.every(cap.boundary().edges, edge => {
    const [n1, n2] = _.map(edge.adjacentFaces(), 'numSides');
    return (n1 === 4) === (n2 === 4);
  });
  return isOrtho ? 'ortho' : 'gyro';
}

export function getGyrateDirection(polyhedron: Polyhedron, cap: Cap) {
  return getCupolaGyrate(polyhedron, cap) === 'ortho' ? 'back' : 'forward';
}
