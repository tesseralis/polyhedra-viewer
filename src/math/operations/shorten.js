// @flow strict
import _ from 'lodash';
import { find } from 'util.js';
import { Polyhedron, Peak } from 'math/polyhedra';
import { isInverse, rotateAround } from 'math/linAlg';
import { getMappedVertices, getMappedPeakVertices } from './operationUtils';
import { Operation } from './operationTypes';

function antiprismHeight(n) {
  const sec = 1 / Math.cos(Math.PI / (2 * n));
  return Math.sqrt(1 - sec * sec / 4);
}

function getOppositePeaks(polyhedron) {
  const peaks = Peak.getAll(polyhedron);
  // FIXME maybe expensive?
  for (let peak of peaks) {
    const peak2 = _.find(peaks, peak2 =>
      isInverse(peak.boundary().normal(), peak2.boundary().normal()),
    );
    if (peak2) return [peak, peak2];
  }
  return undefined;
}

function doShorten(polyhedron: Polyhedron, options) {
  const { twist } = options;
  // FIXME deduplicate this logic with the non-bi case
  const oppositePeaks = getOppositePeaks(polyhedron);
  if (oppositePeaks) {
    const boundary = oppositePeaks[0].boundary();
    const isAntiprism = boundary.edges[0].twin().face.numSides === 3;
    const scale = isAntiprism ? antiprismHeight(boundary.numSides) : 1;
    const theta = isAntiprism ? Math.PI / boundary.numSides : 0;
    const endVertices = getMappedPeakVertices(oppositePeaks, (v, peak) =>
      rotateAround(
        v.vec.sub(
          peak
            .boundary()
            .normal()
            .scale(scale / 2 * polyhedron.edgeLength()),
        ),
        peak.boundary().normalRay(),
        (twist === 'left' ? -1 : 1) * theta / 2,
      ),
    );
    return {
      animationData: {
        start: polyhedron,
        endVertices,
      },
    };
  }
  const faces = polyhedron.faces.filter(face => {
    return _.uniqBy(face.adjacentFaces(), 'numSides').length === 1;
  });
  const face = _.maxBy(faces, 'numSides');
  const isAntiprism = face.adjacentFaces()[0].numSides === 3;
  const scale = isAntiprism ? antiprismHeight(face.numSides) : 1;
  const theta = isAntiprism ? Math.PI / face.numSides : 0;
  const endVertices = getMappedVertices([face], (v, f) =>
    rotateAround(
      v.vec.sub(f.normal().scale(scale * polyhedron.edgeLength())),
      face.normalRay(),
      theta,
    ),
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

function isGyroelongatedBiCupola(polyhedron) {
  const peaks = Peak.getAll(polyhedron);
  const boundary = peaks[0].boundary();
  return (
    peaks.length === 2 &&
    boundary.numSides > 5 &&
    boundary.edges[0].twin().face.numSides === 3
  );
}

function getChirality(polyhedron) {
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
  if (isCupolaRotunda) {
    return rightFaceAcross.numSides !== 3 ? 'right' : 'left';
  }
  return rightFaceAcross.numSides !== 3 ? 'left' : 'right';
}

interface ShortenOptions {
  twist?: 'left' | 'right';
}

export const shorten: Operation<ShortenOptions> = {
  apply: doShorten,
  getSearchOptions(polyhedron, options) {
    if (!isGyroelongatedBiCupola(polyhedron)) return;
    const { twist } = options;
    const chirality = getChirality(polyhedron);
    const gyrate = twist !== chirality ? 'ortho' : 'gyro';
    return { gyrate };
  },

  getAllApplyArgs(polyhedron) {
    if (isGyroelongatedBiCupola(polyhedron)) {
      return [{ twist: 'left' }, { twist: 'right' }];
    }
    return [{}];
  },
};
