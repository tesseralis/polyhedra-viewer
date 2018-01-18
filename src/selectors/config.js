import { createSelector } from 'reselect'
import { mapObject } from 'util.js'
import polygons from 'constants/polygons'
import { getColorInputKey } from 'constants/configOptions'

export const getConfig = state => state.config

const getColors = createSelector(getConfig, config =>
  mapObject(polygons, n => config[getColorInputKey(n)]),
)

export const getPolyhedronConfig = createSelector(
  [getConfig, getColors],
  (config, colors) => ({
    ...config,
    colors,
  }),
)
