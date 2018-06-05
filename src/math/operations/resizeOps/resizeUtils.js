// @flow strict
import _ from 'lodash';

import { flatMapUniq } from 'util.js';
import { Polyhedron, Face } from 'math/polyhedra';
import { PRECISION, getPlane, withOrigin } from 'math/linAlg';
import { getTransformedVertices } from '../operationUtils';

export function getResizedVertices(
  faces: Face[],
  resizedLength: number,
  angle: number = 0,
) {
  // Update the vertices with the expanded-out version
  const f0 = faces[0];
  const scale = resizedLength - f0.distanceToCenter();
  return getTransformedVertices(faces, f =>
    withOrigin(f.centroid(), v =>
      v.getRotatedAroundAxis(f.normal(), angle).add(f.normal().scale(scale)),
    ),
  );
}

type ExpansionType = 'cantellate' | 'snub';

// Return the symmetry group of the *expanded* polyhedron
export function getFamily(polyhedron: Polyhedron) {
  switch (polyhedron.numFaces()) {
    // TODO figure out how to use symmetry to get this result
    case 14: // cuboctahedron
    case 20: // icosahedron
      return 'T';
    case 26: // rhombicuboctahedron
    case 38: // snub cube
      return 'O';
    case 62: // rhombicosidodecahedron
    case 92: // snub dodecahedron
      return 'I';
    default:
      throw new Error('Did you try to contract an invalid solid?');
  }
}

export function expansionType(polyhedron: Polyhedron): ExpansionType {
  return _.includes([20, 38, 92], polyhedron.numFaces())
    ? 'snub'
    : 'cantellate';
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
};

export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron);
  if (typeof nSides === 'number' && face.numSides !== nSides) return false;
  if (!face.isValid()) return false;
  return _.every(face.adjacentFaces(), { numSides: edgeShape[type] });
}

function getFaceDistance(face1, face2) {
  let dist = 0;
  let current = [face1];
  while (!face2.inSet(current)) {
    dist++;
    current = flatMapUniq(current, face => face.adjacentFaces(), 'index');

    if (dist > 10) {
      throw new Error('we went toooooo far');
    }
  }
  return dist;
}

function getIcosahedronContractFaces(polyhedron) {
  let result = [];
  let toTest = polyhedron.faces;
  while (toTest.length > 0) {
    const [next, ...rest] = toTest;
    result.push(next);
    toTest = _.filter(rest, face => getFaceDistance(face, next) === 3);
  }
  return result;
}

function getCuboctahedronContractFaces(polyhedron) {
  const f0 = polyhedron.faceWithNumSides(3);
  const rest = _.map(f0.edges, e => {
    return e
      .twin()
      .next()
      .next()
      .twinFace();
  });
  return [f0, ...rest];
}

export function getExpandedFaces(polyhedron: Polyhedron, faceType?: number) {
  if (getFamily(polyhedron) === 'T') {
    return expansionType(polyhedron) === 'snub'
      ? getIcosahedronContractFaces(polyhedron)
      : getCuboctahedronContractFaces(polyhedron);
  }
  return _.filter(polyhedron.faces, face =>
    isExpandedFace(polyhedron, face, faceType),
  );
}

export function getSnubAngle(polyhedron: Polyhedron, faces: Face[]) {
  const [face0, ...rest] = faces;
  const faceCentroid = face0.centroid();
  const faceNormal = face0.normal();
  const midpoint = face0.edges[0].midpoint();

  const face1 = _.minBy(rest, face => midpoint.distanceTo(face.centroid()));

  const plane = getPlane([
    faceCentroid,
    face1.centroid(),
    polyhedron.centroid(),
  ]);

  const normMidpoint = midpoint.sub(faceCentroid);
  const projected = plane.getProjectedPoint(midpoint).sub(faceCentroid);
  const angle = normMidpoint.angleBetween(projected, true);
  // Return a positive angle if it's a ccw turn, a negative angle otherwise
  const sign = normMidpoint
    .cross(projected)
    .getNormalized()
    .equalsWithTolerance(faceNormal, PRECISION)
    ? -1
    : 1;
  return angle * sign;
}
