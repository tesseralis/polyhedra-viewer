import _ from 'lodash'

const getPolyhedra = groupName => require(`../data/groups/${groupName}.json`)

/* Johnson Solid Subgroups */
const johnsonSolids = getPolyhedra('johnson')
const johnsonSubgroups = require('../data/johnsonSubgroups.json')
const getEndIndex = i =>
  i === johnsonSubgroups.length - 1 ? 92 : johnsonSubgroups[i + 1].index
const getJohnsonPolyhedra = () => {
  return johnsonSubgroups.map(({ name, index }, i) => ({
    name,
    polyhedra: johnsonSolids.slice(index, getEndIndex(i)),
  }))
}

const getNestedPolyhedra = groupName => {
  if (groupName === 'johnson') return { groups: getJohnsonPolyhedra() }
  return { polyhedra: getPolyhedra(groupName) }
}

const groupData = require('../data/groups.json')

const flatGroups = groupData.map(group => ({
  ...group,
  polyhedra: getPolyhedra(group.name),
}))

export const groups = groupData.map(group => ({
  ...group,
  ...getNestedPolyhedra(group.name),
}))

const allSolidNames = _.flatMap(flatGroups, 'polyhedra')

export const isValidSolid = escapedSolidName => {
  return allSolidNames.includes(escapedSolidName.replace(/-/g, ' '))
}

export const getSolidData = escapedSolidName => {
  return require(`data/polyhedra/${escapedSolidName}.json`)
}

export const escapeName = name => name.replace(/ /g, '-')

export const unescapeName = name => name.replace(/-/g, ' ')

const prismNames = {
  3: 'triangular',
  4: 'square',
  5: 'pentagonal',
  6: 'hexagonal',
  8: 'octagonal',
  10: 'decagonal',
}

const inversePrismNames = _.invert(prismNames)

const platonicMapping = {
  T: 'tetrahedron',
  C: 'cube',
  O: 'octahedron',
  D: 'dodecahedron',
  I: 'icosahedron',
}

const inversePlatonicMapping = _.invert(platonicMapping)

const archimedeanMapping = {
  tT: 'truncated tetrahedron',
  aC: 'cuboctahedron',
  tC: 'truncated cube',
  tO: 'truncated octahedron',
  eC: 'rhombicuboctahedron',
  bC: 'truncated cuboctahedron',
  sC: 'snub cube',
  aD: 'icosidodecahedron',
  tD: 'truncated dodecahedron',
  tI: 'truncated icosahedron',
  eD: 'rhombicosidodecahedron',
  bD: 'truncated icosidodecahedron',
  sD: 'snub dodecahedron',
}

const inverseArchimedeanMapping = _.invert(archimedeanMapping)

const fromConwayNotationUnescaped = notation => {
  const prefix = notation[0]
  const number = notation.substring(1)
  if (platonicMapping[notation]) {
    return platonicMapping[notation]
  }
  if (archimedeanMapping[notation]) {
    return archimedeanMapping[notation]
  }
  if (prefix === 'J') {
    return johnsonSolids[number - 1]
  }
  if (prefix === 'P') {
    return `${prismNames[number]} prism`
  }
  if (prefix === 'A') {
    return `${prismNames[number]} antiprism`
  }
  return ''
}

export const fromConwayNotation = notation =>
  escapeName(fromConwayNotationUnescaped(notation))

export const toConwayNotation = solid => {
  const name = unescapeName(solid)
  if (inversePlatonicMapping[name]) {
    return inversePlatonicMapping[name]
  }
  if (inverseArchimedeanMapping[name]) {
    return inverseArchimedeanMapping[name]
  }
  if (_.includes(johnsonSolids, name)) {
    return 'J' + (johnsonSolids.indexOf(name) + 1)
  }
  if (name.includes('antiprism')) {
    const [prefix] = name.split(' ')
    return 'A' + inversePrismNames[prefix]
  }
  if (name.includes('prism')) {
    const [prefix] = name.split(' ')
    return 'P' + inversePrismNames[prefix]
  }
  return null
}
