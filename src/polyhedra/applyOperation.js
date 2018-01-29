import _ from 'lodash'
import { getNextPolyhedron, getRelations } from './relations'
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

// Default augmentee for each numFaces
const defaultAugmentees = {
  3: 'Y3',
  4: 'Y4',
  5: 'Y5',
  6: 'U3',
  8: 'U4',
  10: 'U5',
}

const augmenteeSides = {
  ..._.invert(defaultAugmentees),
  U2: 4,
  R5: 10,
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
  // TODO is it a good idea to keep the defaulting logic here?
  // It makes it harder to unit test
  let options = {}
  let applyConfig = {}
  const relations = getRelations(polyhedron.name, operation)
  if (operation === '+') {
    const fIndex = args
    const n = polyhedron.faces[fIndex].length
    const using =
      config.using && augmenteeSides[config.using] === n
        ? config.using
        : defaultAugmentees[n]

    applyConfig = {
      ...config,
      using,
    }
    options = {
      ...applyConfig,
      align:
        hasMultiple(relations, 'align') &&
        getAugmentAlignment(polyhedron, fIndex),
    }
  } else if (operation === '-') {
    const vIndices = args
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (vIndices.length === 5) {
      options.using = 'U5'
    } else if (vIndices.length === 10) {
      options.using = 'R5'
    }

    if (hasMultiple(relations, 'gyrate')) {
      options.gyrate = getCupolaGyrate(polyhedron, vIndices)
    }

    if (options.gyrate !== 'ortho' && hasMultiple(relations, 'align')) {
      options.align = getDiminishAlignment(polyhedron, vIndices)
    }
  } else if (operation === 'g') {
    const vIndices = args
    if (_.some(relations, 'direction')) {
      options.direction = getGyrateDirection(polyhedron, vIndices)
      if (
        _.filter(
          relations,
          relation =>
            relation.direction === options.direction && !!relation.align,
        ).length > 1
      ) {
        options.align = getGyrateAlignment(polyhedron, vIndices)
      }
    }
  }
  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options))
  if (!_.isFunction(operations[operation])) {
    throw new Error(`Function not found for ${operation}`)
  }
  return operations[operation](polyhedron, args, applyConfig).withName(next)
}
