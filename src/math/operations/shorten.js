// @flow strict
import _ from 'lodash';
import { find } from 'util.js';
import { Polyhedron, Peak } from 'math/polyhedra';
import { isInverse, rotateAround } from 'math/linAlg';
import { antiprismHeight, getMappedVertices } from './operationUtils';
import { Operation } from './operationTypes';

function getOppositePeaks(polyhedron) {
  const peaks = Peak.getAll(polyhedron);
  for (let peak of peaks) {
    const peak2 = _.find(peaks, peak2 =>
      isInverse(peak.normal(), peak2.normal()),
    );
    if (peak2) return [peak, peak2];
  }
  return undefined;
}

function doShorten(polyhedron: Polyhedron, options) {
  const { twist } = options;
  const [setToMap, boundary, multiplier] = (() => {
    const oppositePeaks = getOppositePeaks(polyhedron);
    if (oppositePeaks) {
      // This is an elongated bi-peak
      return [oppositePeaks, oppositePeaks[0].boundary(), 1 / 2];
    } else {
      // Otherwise it's an elongated single peak
      const faces = polyhedron.faces.filter(face => {
        return _.uniqBy(face.adjacentFaces(), 'numSides').length === 1;
      });
      const face = _.maxBy(faces, 'numSides');
      return [[face], face, 1];
    }
  })();
  // FIXME geez, this is basically just the opposite operation
  const isAntiprism = boundary.adjacentFaces()[0].numSides === 3;
  const scale = isAntiprism ? antiprismHeight(boundary.numSides) : 1;
  const theta = isAntiprism ? Math.PI / boundary.numSides : 0;

  const endVertices = getMappedVertices(setToMap, (v, set) =>
    rotateAround(
      v.vec.sub(
        set.normal().scale(scale * polyhedron.edgeLength() * multiplier),
      ),
      set.normalRay(),
      (twist === 'left' ? -1 : 1) * theta * multiplier,
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
    boundary.adjacentFaces()[0].numSides === 3
  );
}

// FIXME can we deduplicate with the snub cube?
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
  // I'm pretty sure this is the same logic as in augment
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
