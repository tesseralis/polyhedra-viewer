// @flow strict
import _ from 'lodash';
import { flatMap, find } from 'util.js';
import type { Twist } from 'types';
import { Polyhedron, Peak } from 'math/polyhedra';
import { isInverse, withOrigin } from 'math/linAlg';
import {
  getTwistSign,
  antiprismHeight,
  getTransformedVertices,
} from './operationUtils';
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

function getOppositePrismFaces(polyhedron) {
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

function doShorten(polyhedron: Polyhedron, options) {
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
  const isAntiprism = boundary.adjacentFaces()[0].numSides === 3;
  const { twist = isAntiprism ? 'left' : undefined } = options;

  // TODO there is logic here that's duplicated in elongate. Maybe consider combining?
  const n = boundary.numSides;
  const scale = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1);
  const theta = getTwistSign(twist) * Math.PI / n;

  const endVertices = getTransformedVertices(setToMap, set =>
    withOrigin(set.normalRay(), v =>
      v
        .sub(set.normal().scale(scale * multiplier))
        .getRotatedAroundAxis(set.normal(), theta * multiplier),
    ),
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

function pivot(list, value) {
  const index = _.indexOf(list, value);
  return [..._.slice(list, index), ..._.slice(list, 0, index)];
}

function bisectPrismFaces(polyhedron, boundary, twist) {
  const prismFaces = _.map(boundary.edges, edge => edge.twinFace());
  const newFaces = flatMap(boundary.edges, edge => {
    const twinFace = edge.twinFace();
    const [v1, v2, v3, v4] = pivot(
      _.map(twinFace.vertices, 'index'),
      edge.v2.index,
    );

    return twist === 'left'
      ? [[v1, v2, v4], [v2, v3, v4]]
      : [[v1, v2, v3], [v1, v3, v4]];
  });

  return polyhedron.withChanges(solid =>
    solid.withoutFaces(prismFaces).addFaces(newFaces),
  );
}

function joinAntiprismFaces(polyhedron, boundary, twist) {
  const antiprismFaces = flatMap(boundary.edges, edge => {
    return [
      edge.twinFace(),
      edge
        .twin()
        .prev()
        .twinFace(),
    ];
  });

  const newFaces = _.map(boundary.edges, edge => {
    const [v1, v2] = edge.twin().vertices;
    const [v3, v4] =
      twist === 'left'
        ? edge
            .twin()
            .prev()
            .twin()
            .next().vertices
        : edge
            .twin()
            .next()
            .twin()
            .prev().vertices;

    return [v1, v2, v3, v4];
  });

  return polyhedron.withChanges(solid =>
    solid.withoutFaces(antiprismFaces).addFaces(newFaces),
  );
}

function doTurn(polyhedron: Polyhedron, options) {
  const [setToMap, boundary, multiplier] = (() => {
    const oppositePrismFaces = getOppositePrismFaces(polyhedron);
    if (oppositePrismFaces) {
      return [oppositePrismFaces, oppositePrismFaces[0], 1 / 2];
    }
    const oppositePeaks = getOppositePeaks(polyhedron);
    if (oppositePeaks) {
      // This is an elongated bi-peak
      return [oppositePeaks, oppositePeaks[0].boundary(), 1 / 2];
    }
    const faces = polyhedron.faces.filter(face => {
      return _.uniqBy(face.adjacentFaces(), 'numSides').length === 1;
    });
    const maxNumSides = _.max(_.map(faces, 'numSides'));
    const prismFaces = _.filter(faces, { numSides: maxNumSides });

    // This is a normal prism or antiprism
    if (prismFaces.length > 1) {
      return [prismFaces, prismFaces[0], 1 / 2];
    }
    // Otherwise it's an elongated single peak
    const face = _.maxBy(faces, 'numSides');
    return [[face], face, 1];
  })();
  const isAntiprism = boundary.adjacentFaces()[0].numSides === 3;
  const { twist = 'left' } = options;
  // const twist = 'left';

  const duplicated = isAntiprism
    ? joinAntiprismFaces(polyhedron, boundary, twist)
    : bisectPrismFaces(polyhedron, boundary, twist);

  // TODO there is logic here that's duplicated in elongate. Maybe consider combining?
  const n = boundary.numSides;
  // const scale = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1);
  const scale =
    polyhedron.edgeLength() * (antiprismHeight(n) - 1) * (isAntiprism ? -1 : 1);
  const theta = getTwistSign(twist) * Math.PI / n;

  const endVertices = getTransformedVertices(setToMap, set =>
    withOrigin(set.normalRay(), v =>
      v
        .add(set.normal().scale(scale * multiplier))
        .getRotatedAroundAxis(set.normal(), theta * multiplier),
    ),
  );
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

function isGyroelongatedBiCupola(polyhedron) {
  const peaks = Peak.getAll(polyhedron);
  if (!peaks[0]) return false;
  const boundary = peaks[0].boundary();
  return (
    peaks.length === 2 &&
    boundary.numSides > 5 &&
    boundary.adjacentFaces()[0].numSides === 3
  );
}

// TODO deduplicate with snub polyhedra if possible
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
  twist?: Twist;
}

export const shorten: Operation<ShortenOptions> = {
  apply: doShorten,
  getSearchOptions(polyhedron, options) {
    if (!isGyroelongatedBiCupola(polyhedron)) return;
    const { twist } = options;
    const chirality = getChirality(polyhedron);
    const gyrate = twist === chirality ? 'ortho' : 'gyro';
    return { gyrate };
  },

  getAllApplyArgs(polyhedron) {
    if (isGyroelongatedBiCupola(polyhedron)) {
      return [{ twist: 'left' }, { twist: 'right' }];
    }
    return [{}];
  },
};

export const turn: Operation<ShortenOptions> = {
  apply: doTurn,
  getSearchOptions(polyhedron, options) {
    if (!isGyroelongatedBiCupola(polyhedron)) return;
    const { twist } = options;
    const chirality = getChirality(polyhedron);
    const gyrate = twist === chirality ? 'ortho' : 'gyro';
    return { gyrate };
  },

  getAllApplyArgs(polyhedron) {
    if (isGyroelongatedBiCupola(polyhedron)) {
      return [{ twist: 'left' }, { twist: 'right' }];
    }
    return [{}];
  },
};
