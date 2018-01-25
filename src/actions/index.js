import _ from 'lodash'
import { getNextPolyhedron, hasOperation } from 'constants/relations'
import { setPolyhedron as setPolyhedronRaw } from 'reducers/polyhedron'
import { isValidSolid, escapeName, unescapeName } from 'constants/polyhedra'
import Polyhedron from 'math/Polyhedron'

import {
  // getElongated,
  // getGyroElongated,
  augment,
  diminish,
  gyrate,
} from 'math/operations'

// Set the polyhedron
export const setPolyhedron = name => dispatch => {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`)
  }
  dispatch(setPolyhedronRaw(name, Polyhedron.get(name)))
}

const operations = {
  // P: getElongated,
  // A: getGyroElongated,
  '+': augment,
  '-': diminish,
  g: gyrate,
}
// Apply the given operation to the given polyhedron
// TODO won't need the "name" parameter in the new one
export const applyOperation = (
  operation,
  name,
  polyhedron,
  config,
) => dispatch => {
  console.log('calling', operation, 'on', polyhedron)
  const options = {}
  const { gyrate, using } = config
  if (operation === '+') {
    if (gyrate) {
      options.gyrate = gyrate
    }
    if (using) {
      options.using = using
    }
  }
  // if (mode && !_.isNil(applyArgs)) {
  const next = escapeName(
    getNextPolyhedron(
      unescapeName(name),
      operation,
      !_.isEmpty(options) ? options : null,
    ),
  )

  dispatch(setPolyhedronRaw(next, operations[operation](polyhedron, config)))
  // FIXME move this here
  // // Get out of current mode if we can't do it any more
  // if (!hasOperation(next, mode)) {
  //   setMode(null)
  // }
}

export * from 'reducers/config'
export * from 'reducers/filter'
export * from 'reducers/controls'
