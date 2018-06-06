// @flow strict
import _ from 'lodash';
import type { Twist } from 'types';
import { find } from 'utils';
import { Polyhedron, Peak } from 'math/polyhedra';
import { withOrigin, isInverse } from 'math/linAlg';
import { getTwistSign, getTransformedVertices } from '../operationUtils';

// Get antiprism height of a unit antiprism with n sides
export function antiprismHeight(n: number) {
  const sec = 1 / Math.cos(Math.PI / (2 * n));
  return Math.sqrt(1 - (sec * sec) / 4);
}

// TODO deduplicate with snub polyhedra if possible
export function getChirality(polyhedron: Polyhedron) {
  const [peak1, peak2] = Peak.getAll(polyhedron);
  const boundary = peak1.boundary();
  const isCupolaRotunda = peak1.type !== peak2.type;

  const nonTriangleFace = find(boundary.edges, e => e.face.numSides !== 3);
  const rightFaceAcross = nonTriangleFace
    .twin()
    .prev()
    .twin()
    .next()
    .twin().face;
  // I'm pretty sure this is the same logic as in augment
  if (isCupolaRotunda) {
    return rightFaceAcross.numSides !== 3 ? 'right' : 'left';
  }
  return rightFaceAcross.numSides !== 3 ? 'left' : 'right';
}

export function isGyroelongatedBiCupola(polyhedron: Polyhedron) {
  const peaks = Peak.getAll(polyhedron);
  if (!peaks[0]) return false;
  const boundary = peaks[0].boundary();
  return (
    peaks.length === 2 &&
    boundary.numSides > 5 &&
    boundary.adjacentFaces()[0].numSides === 3
  );
}

function getOppositePeaks(polyhedron: Polyhedron) {
  const peaks = Peak.getAll(polyhedron);
  for (let peak of peaks) {
    const peak2 = _.find(peaks, peak2 =>
      isInverse(peak.normal(), peak2.normal()),
    );
    if (peak2) return [peak, peak2];
  }
  return undefined;
}

function getOppositePrismFaces(polyhedron: Polyhedron) {
  const face1 = _.maxBy(
    _.filter(polyhedron.faces, face => {
      const faceCounts = _.countBy(
        face.vertexAdjacentFaces().filter(f => !f.equals(face)),
        'numSides',
      );
      return (
        _.isEqual(faceCounts, { '4': face.numSides }) ||
        _.isEqual(faceCounts, { '3': 2 * face.numSides })
      );
    }),
    'numSides',
  );
  if (!face1) return undefined;

  const face2 = _.find(
    polyhedron.faces,
    face2 =>
      face1.numSides === face2.numSides &&
      isInverse(face1.normal(), face2.normal()),
  );
  if (face2) return [face1, face2];
  return undefined;
}

export function getAdjustInformation(polyhedron: Polyhedron) {
  const oppositePrismFaces = getOppositePrismFaces(polyhedron);
  if (oppositePrismFaces) {
    return {
      vertexSets: oppositePrismFaces,
      boundary: oppositePrismFaces[0],
      multiplier: 1 / 2,
    };
  }
  const oppositePeaks = getOppositePeaks(polyhedron);
  if (oppositePeaks) {
    // This is an elongated bi-peak
    return {
      vertexSets: oppositePeaks,
      boundary: oppositePeaks[0].boundary(),
      multiplier: 1 / 2,
    };
  }

  // Otherwise it's an elongated single peak
  const faces = polyhedron.faces.filter(face => {
    return _.uniqBy(face.adjacentFaces(), 'numSides').length === 1;
  });
  const face = _.maxBy(faces, 'numSides');
  return {
    vertexSets: [face],
    boundary: face,
    multiplier: 1,
  };
}

export function getScaledPrismVertices(
  adjustInfo: *,
  scale: number,
  twist: ?Twist,
) {
  const { vertexSets, boundary, multiplier } = adjustInfo;
  const n = boundary.numSides;
  const angle = (getTwistSign(twist) * Math.PI) / n;

  return getTransformedVertices(vertexSets, set =>
    withOrigin(set.normalRay(), v =>
      v
        .add(set.normal().scale(scale * multiplier))
        .getRotatedAroundAxis(set.normal(), angle * multiplier),
    ),
  );
}
