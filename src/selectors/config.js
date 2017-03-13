import { mapObject } from '../util'
import polygons from '../constants/polygons'
import { getColorInputKey } from '../constants/configOptions'

const getColors = state => mapObject(polygons, n => state[getColorInputKey(n)])
export const getPolyhedronConfig = state => ({ ...state, colors: getColors(state) })
export const getConfigValues = state => state
