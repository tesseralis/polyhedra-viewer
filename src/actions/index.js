import _ from 'lodash'
import { getNextPolyhedron, hasOperation } from 'constants/relations'
import { setPolyhedron as setPolyhedronRaw } from 'reducers/polyhedron'
import { setOperation, setApplyOpts } from 'reducers/controls'
import { isValidSolid } from 'constants/polyhedra'
import Polyhedron from 'math/Polyhedron'
import { getOperations } from 'constants/relations'

import {
  truncate,
  elongate,
  gyroelongate,
  shorten,
  augment,
  diminish,
  gyrate,
  getAugmentAlignment,
  getDiminishAlignment,
  getDiminishGyrate,
  getGyrateDirection,
  getGyrateAlignment,
} from 'math/operations'

// Set the polyhedron
export const setPolyhedron = name => dispatch => {
  if (!isValidSolid(name)) {
    throw new Error(`Got a solid with an invalid name: ${name}`)
  }
  dispatch(setPolyhedronRaw(Polyhedron.get(name)))
  dispatch(setMode(null))
}

const operations = {
  t: truncate,
  P: elongate,
  A: gyroelongate,
  '~P': shorten,
  '~A': shorten,
  '+': augment,
  '-': diminish,
  g: gyrate,
}

// TODO deduplicate with the other thing
const defaultAugmentees = {
  3: 'Y3',
  4: 'Y4',
  5: 'Y5',
  6: 'U3',
  8: 'U4',
  10: 'U5',
}

const setApplyOptsFor = (solid, operation) => dispatch => {
  if (!solid) return
  const relations = getOperations(solid, operation)
  const newOpts = { gyrate: null, using: null }
  if (operation === '+') {
    if (_.filter(relations, 'gyrate').length > 1) {
      newOpts.gyrate = 'ortho'
    }
    if (hasMultipleOptionsForFace(relations)) {
      newOpts.using = relations[0].using
    }
  }
  dispatch(setApplyOpts(newOpts))
}

// Apply the given operation to the given polyhedron
// TODO won't need the "name" parameter in the new one
export const applyOperation = (
  operation,
  polyhedron,
  config = {},
) => dispatch => {
  // TODO is it a good idea to keep the defaulting logic here?
  // It makes it harder to unit test
  const options = {}
  const { gyrate, using } = config
  const relations = getOperations(polyhedron.name, operation)
  if (operation === '+') {
    if (using === 'U2') {
      options.gyrate = 'gyro'
    } else if (gyrate) {
      options.gyrate = gyrate
    }
    options.using =
      using || defaultAugmentees[polyhedron.faces[config.fIndex].length]

    if (_.filter(relations, 'align').length > 1) {
      options.align = getAugmentAlignment(polyhedron, config.fIndex)
    }
  } else if (operation === '-') {
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (config.vIndices.length === 5) {
      options.using = 'U5'
    } else if (config.vIndices.length === 10) {
      options.using = 'R5'
    }

    if (_.filter(relations, 'gyrate').length > 1) {
      options.gyrate = getDiminishGyrate(polyhedron, config.vIndices)
    }

    if (
      _.filter(
        relations,
        relation =>
          (!!relation.gyrate ? relation.gyrate === options.gyrate : true) &&
          !!relation.align,
      ).length > 1
    ) {
      options.align = getDiminishAlignment(polyhedron, config.vIndices)
    }
  } else if (operation === 'g') {
    if (_.some(relations, 'direction')) {
      options.direction = getGyrateDirection(polyhedron, config.vIndices)
      if (
        _.filter(
          relations,
          relation =>
            relation.direction === options.direction && !!relation.align,
        ).length > 1
      ) {
        options.align = getGyrateAlignment(polyhedron, config.vIndices)
        console.log('options.align: ', options.align)
      }
    }
    console.log(relations)
  }
  // TODO should I move this logic to the actual operation?
  const next = getNextPolyhedron(
    polyhedron.name,
    operation,
    !_.isEmpty(options) ? options : null,
  )

  dispatch(
    setPolyhedronRaw(
      operations[operation](polyhedron, { ...config, ...options }).withName(
        next,
      ),
    ),
  )
  if (!hasOperation(next, operation)) {
    dispatch(setMode(null))
  } else {
    dispatch(setApplyOptsFor(next, operation))
  }
  // TODO otherwise reset the apply opts for the new polyhedron
}

function hasMultipleOptionsForFace(relations) {
  return _.some(
    relations,
    relation =>
      _.isObject(relation) && _.includes(['U2', 'R5'], relation.using),
  )
}

export const setMode = (solid, operation) => dispatch => {
  dispatch(setOperation(operation))
  dispatch(setApplyOptsFor(solid, operation))
}

export const setApplyOpt = (name, value) => dispatch => {
  dispatch(setApplyOpts({ [name]: value }))
}

export * from 'reducers/config'

export * from 'reducers/filter'
// export * from 'reducers/controls'
