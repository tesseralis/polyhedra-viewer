import _ from 'lodash';
import polygons, { polygonNames, PolygonMap } from 'math/polygons';

// Colors from d3-scale-chromatic:
// https://github.com/d3/d3-scale-chromatic#schemeCategory10
const defaultColors: PolygonMap<string> = {
  3: '#ff7f00',
  4: '#e41a1c',
  5: '#377eb8',
  6: '#4daf4a',
  8: '#a65628',
  10: '#984ea3',
};

export interface ConfigInput<T> {
  key: string;
  type: string;
  default: T;
  display: string;
}

const colorOptionsList = polygons.map(n => {
  return {
    key: `colors[${n}]`,
    display: `${_.startCase(polygonNames[n])} Color`,
    type: 'color',
    default: defaultColors[n],
  };
});

export const configInputs: ConfigInput<any>[] = [
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
    key: 'animationSpeed',
    type: 'select',
    options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    default: 1,
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
