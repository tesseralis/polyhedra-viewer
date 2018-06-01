// @flow strict
import _ from 'lodash';
import { schemeSet1 } from 'd3-scale-chromatic';

import polygons, { polygonNames } from './polygons';

const polygonSchemeIdx = { '3': 4, '4': 0, '5': 1, '6': 2, '8': 6, '10': 3 };

const colorOptionsList = polygons.map(n => {
  return {
    key: `colors[${n}]`,
    display: `${_.startCase(polygonNames[n])} Color`,
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
    // TODO <select> would probably be best
    key: 'animationSpeed',
    type: 'range',
    default: 1,
    min: 0.25,
    max: 2,
    step: 0.25,
  },
  ...colorOptionsList,
].map(input => ({
  ...input,
  display: _.get(input, 'display', _.startCase(input.key)),
}));

export const defaultConfig = _.reduce(
  configInputs,
  (obj, option) => {
    _.set(obj, option.key, option.default);
    return obj;
  },
  {},
);
