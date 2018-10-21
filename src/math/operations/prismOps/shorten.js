// @flow strict
import { Polyhedron } from 'math/polyhedra';
import {
  antiprismHeight,
  getChirality,
  isGyroelongatedBiCupola,
  getAdjustInformation,
  getScaledPrismVertices,
} from './prismUtils';
import makeOperation from '../makeOperation';

function doShorten(polyhedron: Polyhedron, options) {
  const adjustInfo = getAdjustInformation(polyhedron);
  const { boundary } = adjustInfo;
  const isAntiprism = boundary.adjacentFaces()[0].numSides === 3;
  const { twist = isAntiprism ? 'left' : undefined } = options;

  const n = boundary.numSides;
  const scale = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1);

  const endVertices = getScaledPrismVertices(adjustInfo, -scale, twist);

  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

export const shorten = makeOperation('shorten', {
  apply: doShorten,
  resultsFilter(polyhedron, options) {
    if (!isGyroelongatedBiCupola(polyhedron)) return;
    const { twist } = options;
    const chirality = getChirality(polyhedron);
    const gyrate = twist === chirality ? 'ortho' : 'gyro';
    return { gyrate };
  },

  allOptionCombos(polyhedron) {
    if (isGyroelongatedBiCupola(polyhedron)) {
      return [{ twist: 'left' }, { twist: 'right' }];
    }
    return [{}];
  },
});
