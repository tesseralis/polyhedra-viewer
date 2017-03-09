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

export const groups = groupNames.map(groupName => ({
  name: groupName,
  description: groupDescriptions[groupName],
  polyhedra: require(`../data/metadata/${groupName}.json`),
}))

export const getSolidData = escapedSolidName => {
  return require(`../data/polyhedra/${escapedSolidName}.json`)
}
