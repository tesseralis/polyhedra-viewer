import _ from 'lodash'

const groupNames = [
  'platonic',
  'archimedean',
  'prisms',
  'antiprisms',
  'johnson',
]

const groupDescriptions = {
  platonic: 'Regular, convex polyhedra, constructed with the same number of congruent regular polygons meeting at each vertex.',
  archimedean: 'Semi-regular convex polyhedra composed of regular polygons meeting in identical vertices.',
  prisms: 'Polyhedra comprising two 𝑛-sided polygonal bases and 𝑛 square faces joining the two.',
  antiprisms: 'Polyhedra composed of two parallel copies of some particular 𝑛-sided polygon, connected by an alternating band of triangles.',
  johnson: 'Strictly convex, non-uniform polyhedra, whose faces are regular polygons.',
}

const johnsonSubgroups = [
  'pyramids',
  'cupolæ and rotunda',
  'elongated and gyroelongated pyramids',
  'bipyramids',
  'elongated cupolæ and rotundæ',
  'bicupolæ',
  'cupola-rotundæ and birotunda',
  'elongated bicupolæ',
  'elongated cupola-rotundæ and birotundæ',
  'gyroelongated bicupolæ, cupola-rotunda, and birotunda',
  'augmented triangular prisms',
  'augmented pentagonal and hexagonal prisms',
  'augmented dodecahedra',
  'diminished icosahedra',
  'augmented truncated tetrahedron and truncated cubes',
  'augmented truncated dodecahedra',
  'gyrate rhombicosidodecahedra',
  'diminished rhombicosidodecahedra',
  'snub antiprisms',
  'others',
]

// TODO come up with a less janky way to store these
const johnsonSubgroupIndices = {
  'pyramids': 2,
  'cupolæ and rotunda': 6,
  'elongated and gyroelongated pyramids': 11,
  'bipyramids': 17,
  'elongated cupolæ and rotundæ': 25,
  'bicupolæ': 31,
  'cupola-rotundæ and birotunda': 34,
  'elongated bicupolæ': 39,
  'elongated cupola-rotundæ and birotundæ': 43,
  'gyroelongated bicupolæ, cupola-rotunda, and birotunda': 48,
  'augmented triangular prisms': 51,
  'augmented pentagonal and hexagonal prisms': 57,
  'augmented dodecahedra': 61,
  'diminished icosahedra': 64,
  'augmented truncated tetrahedron and truncated cubes': 67,
  'augmented truncated dodecahedra': 71,
  'gyrate rhombicosidodecahedra': 75,
  'diminished rhombicosidodecahedra': 83,
  'snub antiprisms': 85,
  'others': 92,
}

const getPolyhedra = groupName => require(`../data/groups/${groupName}.json`)

const getJohnsonPolyhedra = () => {
  const johnsonSolids = getPolyhedra('johnson')
  return johnsonSubgroups.map((subgroupName, i) => ({
    name: subgroupName,
    polyhedra: johnsonSolids.slice(i === 0 ? 0 : johnsonSubgroupIndices[johnsonSubgroups[i-1]], johnsonSubgroupIndices[subgroupName]),
  }))
}

const getNestedPolyhedra = groupName => {
  if (groupName === 'johnson') return { groups: getJohnsonPolyhedra() }
  return { polyhedra: getPolyhedra(groupName) }
}

const flatGroups = groupNames.map(groupName => ({
  name: groupName,
  polyhedra: getPolyhedra(groupName),
}))

export const groups = groupNames.map(groupName => ({
  name: groupName,
  description: groupDescriptions[groupName],
  ...getNestedPolyhedra(groupName),
}))

const allSolidNames = _.flatMap(flatGroups, 'polyhedra')

export const isValidSolid = escapedSolidName => {
  return allSolidNames.includes(escapedSolidName.replace(/-/g, ' '))
}

export const getSolidData = escapedSolidName => {
  return require(`../data/polyhedra/${escapedSolidName}.json`)
}

export const escapeName = name => name.replace(/ /g, '-');
