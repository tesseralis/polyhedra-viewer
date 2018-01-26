import _ from 'lodash'
import { getNextPolyhedron, hasOperation } from 'constants/relations'
import { setPolyhedron as setPolyhedronRaw } from 'reducers/polyhedron'
import { setOperation, setApplyOpts } from 'reducers/controls'
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
  dispatch(setPolyhedronRaw(Polyhedron.get(name)))
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
export const applyOperation = (operation, polyhedron, config) => dispatch => {
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
      unescapeName(polyhedron.name),
      operation,
      !_.isEmpty(options) ? options : null,
    ),
  )

  dispatch(
    setPolyhedronRaw(operations[operation](polyhedron, config).withName(next)),
  )
  // // Get out of current mode if we can't do it any more
  if (!hasOperation(next, operation)) {
    dispatch(setMode(null))
  }
  // TODO otherwise reset the apply opts for the new polyhedron
}

function hasMultipleOptionsForFace(relations) {
  return _.some(
    relations,
    relation =>
      _.isObject(relation) && _.includes(['U2', 'U5', 'R5'], relation.using),
  )
}

// FIXME still broken
export const setMode = (operation, relations) => dispatch => {
  const newOpts = {}
  if (operation === '+') {
    // FIXME I don't like this, not one bit!
    if (_.filter(relations, 'gyrate').length > 1) {
      newOpts.gyrate = 'ortho'
    }
    if (hasMultipleOptionsForFace(relations)) {
      newOpts.using = relations[0].using
    }
  }
  dispatch(setOperation(operation))
  dispatch(setApplyOpts(newOpts))
}

export const setApplyOpt = (name, value) => dispatch => {
  dispatch(setApplyOpts({ [name]: value }))
}

export * from 'reducers/config'

export * from 'reducers/filter'
// export * from 'reducers/controls'
