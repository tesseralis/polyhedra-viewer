// @flow strict

import { scaleAround } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';
import { duplicateVertices, getMappedVertices } from './operationUtils';

export function dual(polyhedron: Polyhedron) {
  const scale = (() => {
    const f = polyhedron.getFace().distanceToCenter();
    const e = polyhedron.getEdge().distanceToCenter();
    return e * e / (f * f);
  })();
  const duplicated = duplicateVertices(polyhedron);
  const endVertices = getMappedVertices(
    polyhedron.faces.map(face => face.withPolyhedron(duplicated)),
    (v, f) => scaleAround(f.centroid(), polyhedron.centroid(), scale),
  );

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}
