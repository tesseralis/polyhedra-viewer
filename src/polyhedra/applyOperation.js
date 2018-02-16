import _ from 'lodash'
import {
  operations,
  getNextPolyhedron,
  getRelations,
  getUsingOpt,
} from './relations'
import Polyhedron from 'math/Polyhedron'
// TODO move the op functions to an object so we can reference them?
import {
  operationFunctions,
  getAugmentAlignment,
  getPeakAlignment,
  getCupolaGyrate,
  getGyrateDirection,
} from 'math/operations'

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

export default function applyOperation(operation, polyhedron, config = {}) {
  let options = {}
  let applyConfig = config
  const relations = getRelations(polyhedron.name, operation)
  if (operation === '+') {
    const { fIndex } = config
    const n = polyhedron.faces[fIndex].length

    const using = getUsingOpt(config.using, n)

    const baseConfig = {
      using,
      gyrate: using === 'U2' ? 'gyro' : config.gyrate,
    }
    applyConfig = { ...applyConfig, ...baseConfig }
    options = {
      ...baseConfig,
      align:
        hasMultiple(relations, 'align') &&
        getAugmentAlignment(polyhedron, fIndex),
    }
  } else if (operation === '-') {
    const { peak } = config
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
    const { peak } = config
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
    options = config
    // FIXME reimplement this
    // applyConfig = { faceType: platonicMap[config.value] }
  }

  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options))
  const opFunction =
    operationFunctions[_.find(operations, { symbol: operation }).name]
  if (!_.isFunction(opFunction)) {
    // throw new Error(`Function not found for ${operation}`)
    return Polyhedron.get(next)
  }
  return opFunction(polyhedron, applyConfig).withName(next)
}
