import _ from 'lodash'
import { schemeSet1 } from 'd3-scale-chromatic'

import polygons, { polygonNames } from './polygons'
import { mapObject } from '../util'

const polygonSchemeIdx = { 3: 4, 4: 0, 5: 1, 6: 2, 8: 3, 10: 6 }

export const getColorInputKey = n => `${polygonNames[n]}Color`

const colorOptionsList = polygons.map(n => {
  return {
    key: getColorInputKey(n),
    type: 'color',
    default: schemeSet1[polygonSchemeIdx[n]],
  }
})

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
    key: 'opacity',
    type: 'range',
    default: 0.9,
    min: 0,
    max: 1,
    step: 0.01,
  },
  ...colorOptionsList,
].map(input => ({
  ...input,
  display: input.display || _.startCase(input.key),
}))

const configOptions = mapObject(configInputs, value => [value.key, value])

export const defaultConfig = _.mapValues(configOptions, 'default')

const getColors = config =>
  mapObject(polygons, n => [n, config[getColorInputKey(n)]])

export const getPolyhedronConfig = config => ({
  ...config,
  colors: getColors(config),
})
