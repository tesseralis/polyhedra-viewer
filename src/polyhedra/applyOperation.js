import _ from 'lodash'
import { getNextPolyhedron, getRelations, getUsingOpt } from './relations'
import Polyhedron from 'math/Polyhedron'
import {
  truncate,
  rectify,
  cumulate,
  elongate,
  gyroelongate,
  shorten,
  augment,
  diminish,
  gyrate,
  getAugmentAlignment,
  getPeakAlignment,
  getCupolaGyrate,
  getGyrateDirection,
} from 'math/operations'

const operations = {
  t: truncate,
  a: rectify,
  k: cumulate,
  P: elongate,
  A: gyroelongate,
  h: shorten,
  '+': augment,
  '-': diminish,
  g: gyrate,
}

const platonicMap = {
  T: 3,
  C: 3,
  O: 4,
  D: 3,
  I: 5,
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
  let options = config
  let applyConfig = {}
  const relations = getRelations(polyhedron.name, operation)
  if (operation === '+') {
    const fIndex = args
    const n = polyhedron.faces[fIndex].length

    const using = getUsingOpt(config.using, n)

    applyConfig = {
      using,
      gyrate: using === 'U2' ? 'gyro' : config.gyrate,
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
      options.align = getPeakAlignment(polyhedron, peak)
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
        options.align = getPeakAlignment(polyhedron, peak)
      }
    }
  } else if (_.includes(['k', 'c'], operation)) {
    applyConfig = { faceType: platonicMap[config.value] }
    options = config
  }

  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options))
  if (!_.isFunction(operations[operation])) {
    // throw new Error(`Function not found for ${operation}`)
    return Polyhedron.get(next)
  }
  return operations[operation](polyhedron, args, applyConfig).withName(next)
}
