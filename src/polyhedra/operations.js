import _ from 'lodash'
import { getNextPolyhedron, getOperations } from './relations'
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

export function applyOperation(operation, polyhedron, config = {}) {
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

  return operations[operation](polyhedron, { ...config, ...options }).withName(
    next,
  )
}
