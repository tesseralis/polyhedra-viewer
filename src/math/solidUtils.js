import _ from 'lodash'

// Get the element of the array at the given index,
// modulo its length
function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}
export function getCyclic(array, index) {
  return array[mod(index, array.length)]
}

// Return the number of sides of a face
export const numSides = face => face.length

export function getDirectedEdges(face) {
  return _.map(face, (vertex, index) => {
    return [vertex, getCyclic(face, index + 1)]
  })
}

// Get a face representing the boundary of the faces
export function getBoundary(faces) {
  const edges = {}
  // build up a lookup table for every pair of edges to that face
  _.forEach(faces, (face, index) => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    _.forEach(getDirectedEdges(face), edge => {
      const [i1, i2] = edge
      if (_.includes(edges[i2], i1)) {
        _.pull(edges[i2], i1)
      } else {
        if (!edges[i1]) {
          edges[i1] = []
        }
        edges[i1].push(i2)
      }
    })
  })

  const cycle = _(edges)
    .pickBy('length')
    .mapValues(0)
    .value()
  const first = _.values(cycle)[0]
  const result = [first]
  for (let i = cycle[first]; i !== first; i = cycle[i]) {
    result.push(i)
  }
  return result
}

export function nextVertex(face, vIndex) {
  return getCyclic(face, face.indexOf(vIndex) + 1)
}

export function prevVertex(face, vIndex) {
  return getCyclic(face, face.indexOf(vIndex) - 1)
}

