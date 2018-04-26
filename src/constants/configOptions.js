import _ from 'lodash';
import { schemeSet1 } from 'd3-scale-chromatic';

import polygons, { polygonNames } from './polygons';
import { mapObject } from '../util';

const polygonSchemeIdx = { 3: 4, 4: 0, 5: 1, 6: 2, 8: 6, 10: 3 };

export const getColorInputKey = n => `${polygonNames[n]}Color`;

const colorOptionsList = polygons.map(n => {
  return {
    key: getColorInputKey(n),
    type: 'color',
    default: schemeSet1[polygonSchemeIdx[n]],
  };
});

export const configInputs = [
  {
    key: 'showEdges',
    type: 'checkbox',
    default: true,
  },
  {
    key: 'showFaces',
    type: 'checkbox',
    default: true,
  },
  {
    key: 'showInnerFaces',
    type: 'checkbox',
    default: true,
  },
  {
    key: 'opacity',
    type: 'range',
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: 'enableAnimation',
    type: 'checkbox',
    default: true,
  },
  {
    // FIXME help this make more sense
    key: 'transitionDuration',
    type: 'number',
    default: 750,
  },
  ...colorOptionsList,
].map(input => ({
  ...input,
  display: input.display || _.startCase(input.key),
}));

const configOptions = mapObject(configInputs, value => [value.key, value]);

export const defaultConfig = _.mapValues(configOptions, 'default');

const getColors = config =>
  mapObject(polygons, n => [n, config[getColorInputKey(n)]]);

// const getMock = color => _.mapValues(polygonSchemeIdx, () => color)

// TODO implement interpolated colors
// export const getPolyhedronConfig = config => {
//   const colors = getColors(config)
//   const diminishColors = interpolate(colors, getMock('red'))(0.5)

//   return {
//     ...config,
//     colors,
//     diminishColors,
//   }
// }

export const getPolyhedronConfig = config => ({
  ...config,
  colors: getColors(config),
});
