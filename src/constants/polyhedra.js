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
  return require(`../data/polyhedra/${escapedSolidName}.json`)
}

export const escapeName = name => name.replace(/ /g, '-')

const prismNames = {
  3: 'triangular',
  4: 'square',
  5: 'pentagonal',
  6: 'hexagonal',
  8: 'octagonal',
  10: 'decagonal',
}

const platonicMapping = {
  T: 'tetrahedron',
  C: 'cube',
  O: 'octahedron',
  D: 'dodecahedron',
  I: 'icosahedron',
}

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

export const fromConwayNotation = notation => {
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
  return null
}
