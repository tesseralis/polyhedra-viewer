import _ from 'lodash'
import { fromConwayNotation, toConwayNotation } from './names'
import polyhedraGraph from './relationsGraph'

export const operations = [
  {
    name: 'truncate',
    symbol: 't',
    description: 'Cut and create a new face at each vertex.',
  },
  {
    name: 'rectify',
    symbol: 'a',
    description: 'Cut (truncate) each vertex at the midpoint of each edge.',
  },
  {
    name: 'cumulate',
    symbol: 'k',
    description: 'Opposite of truncation. Append a pyramid at certain faces.',
  },
  {
    name: 'dual',
    symbol: 'd',
    description: 'Replace each face with a vertex.',
  },
  {
    name: 'expand',
    symbol: 'e',
    description: 'Pull out faces, creating new square faces.',
  },
  {
    name: 'snub',
    symbol: 's',
    description: 'Pull out and twist faces, creating new triangular faces.',
  },
  {
    name: 'contract',
    symbol: 'c',
    description: 'Opposite of expand/snub. Shrink faces in, removing faces.',
  },
  {
    name: 'elongate',
    symbol: 'P',
    description: 'Extend with a prism.',
  },
  {
    name: 'gyroelongate',
    symbol: 'A',
    description: 'Extend with an antiprism.',
  },
  {
    name: 'shorten',
    symbol: 'h',
    description: 'Remove a prism or antiprism',
  },
  {
    name: 'twist',
    symbol: 'p',
    description:
      'Replace each square face with two triangular faces, or vice versa.',
  },
  {
    name: 'augment',
    symbol: '+',
    description: 'Append a pyramid, cupola, or rotunda.',
  },
  {
    name: 'diminish',
    symbol: '-',
    description: 'Remove a pyramid, cupola, or rotunda.',
  },
  {
    name: 'gyrate',
    symbol: 'g',
    description: 'Rotate a cupola or rotunda.',
  },
]

// Get the operations that can be applied to the given solid
export function getOperations(solid) {
  return _.keys(polyhedraGraph[toConwayNotation(solid)])
}

export function getRelations(solid, operation) {
  return polyhedraGraph[toConwayNotation(solid)][operation]
}

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

export function getUsingOpts(solid) {
  const augments = getRelations(solid, '+')
  const using = _.uniq(_.map(augments, 'using'))
  const grouped = _.groupBy(using, option => augmenteeSides[option])
  return _.find(grouped, group => group.length > 1) || []
}

export function getUsingOpt(using, numSides) {
  return using && augmenteeSides[using] === numSides
    ? using
    : defaultAugmentees[numSides]
}

// Get the polyhedron name as a result of applying the operation to the given polyhedron
export function getNextPolyhedron(solid, operation, filterOpts) {
  const next = _(polyhedraGraph[toConwayNotation(solid)][operation])
    .filter(!_.isEmpty(filterOpts) ? filterOpts : _.stubTrue)
    .value()
  if (next.length > 1) {
    throw new Error(
      `Multiple possibilities found for operation ${operation} on ${solid} with options ${JSON.stringify(
        filterOpts,
      )}: ${JSON.stringify(next)}`,
    )
  } else if (next.length === 0) {
    throw new Error(
      `No possibilities found for operation ${operation} on ${solid} with options ${JSON.stringify(
        filterOpts,
      )}. Are you sure you didn't put in too many?`,
    )
  }

  return fromConwayNotation(next[0].value)
}

function hasMultipleOptionsForFace(relations) {
  return _.some(relations, relation => _.includes(['U2', 'R5'], relation.using))
}

export function applyOptionsFor(solid, operation) {
  if (!solid) return
  const relations = getRelations(solid, operation)
  const newOpts = {}
  if (operation === '+') {
    if (_.filter(relations, 'gyrate').length > 1) {
      newOpts.gyrate = 'ortho'
    }
    if (hasMultipleOptionsForFace(relations)) {
      newOpts.using = getUsingOpts(solid)[0]
    }
  }
  return newOpts
}
