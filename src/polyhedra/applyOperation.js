import _ from 'lodash'
import { getNextPolyhedron, getRelations, getUsingOpt } from './relations'
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
  getCupolaGyrate,
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

const hasMultiple = (relations, property) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1

export default function applyOperation(
  operation,
  polyhedron,
  args,
  config = {},
) {
  let options = {}
  let applyConfig = {}
  const relations = getRelations(polyhedron.name, operation)
  if (operation === '+') {
    const fIndex = args
    const n = polyhedron.faces[fIndex].length

    applyConfig = {
      ...config,
      using: getUsingOpt(config.using, n),
    }
    options = {
      ...applyConfig,
      align:
        hasMultiple(relations, 'align') &&
        getAugmentAlignment(polyhedron, fIndex),
    }
  } else if (operation === '-') {
    const peak = args
    const vIndices = peak.innerVertexIndices()
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (vIndices.length === 5) {
      options.using = 'U5'
    } else if (vIndices.length === 10) {
      options.using = 'R5'
    }

    if (hasMultiple(relations, 'gyrate')) {
      options.gyrate = getCupolaGyrate(polyhedron, peak)
    }

    if (options.gyrate !== 'ortho' && hasMultiple(relations, 'align')) {
      options.align = getDiminishAlignment(polyhedron, peak)
    }
  } else if (operation === 'g') {
    const peak = args
    if (_.some(relations, 'direction')) {
      options.direction = getGyrateDirection(polyhedron, peak)
      if (
        _.filter(
          relations,
          relation =>
            relation.direction === options.direction && !!relation.align,
        ).length > 1
      ) {
        options.align = getGyrateAlignment(polyhedron, peak)
      }
    }
  }
  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options))
  if (!_.isFunction(operations[operation])) {
    throw new Error(`Function not found for ${operation}`)
  }
  return operations[operation](polyhedron, args, applyConfig).withName(next)
}
