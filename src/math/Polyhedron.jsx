import _ from 'lodash'
import { getSolidData } from 'constants/polyhedra'
import { vec, isPlanar } from './linAlg'

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

// Get the element of the array at the given index,
// modulo its length
function getCyclic(array, index) {
  return array[mod(index, array.length)]
}

function getEdges(face) {
  return _.map(face, (vertex, index) => {
    return _.sortBy([vertex, getCyclic(face, index + 1)])
  })
}

// TODO optimize/clean this up
function getAllEdges(faces) {
  return _.uniqWith(_.flatMap(faces, getEdges), _.isEqual)
}

function getEdgesOrdered(face) {
  return _.map(face, (vertex, index) => {
    return [vertex, getCyclic(face, index + 1)]
  })
}

// Return the number of sides of a face
const numSides = face => face.length

// Return if the two faces share an edge
const shareEdge = (face1, face2) => _.intersection(face1, face2).length === 2

// Get a face representing the boundary of the faces
export function getBoundary(faces) {
  const edges = {}
  // build up a lookup table for every pair of edges to that face
  _.forEach(faces, (face, index) => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    _.forEach(getEdgesOrdered(face), edge => {
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

// TODO: this is a JSX class because otherwise class properties won't be highlighted in sublime
export default class Polyhedron {
  static get(name) {
    const { vertices, faces } = getSolidData(name)
    return new Polyhedron(vertices, faces)
  }

  constructor(vertices, faces, edges) {
    this.vertices = vertices
    this.faces = faces
    if (edges) {
      this._edges = edges
    }
  }

  get edges() {
    if (!this._edges) {
      this._edges = getAllEdges(this.faces)
    }
    return this._edges
  }

  toJSON() {
    return _.pick('vertices', 'faces', 'edges')
  }

  numVertices() {
    return this.vertices.length
  }

  numFaces() {
    return this.faces.length
  }

  vIndices() {
    return _.range(this.numVertices())
  }

  fIndices() {
    return _.range(this.numFaces())
  }

  // Return the vectors of this polyhedron as vectors
  vertexVectors = _.memoize(() => this.vertices.map(vec))

  // Return the faces adjacent to the given vertices
  adjacentFaceIndices(...vIndices) {
    return _(vIndices)
      .flatMap(vIndex => this.vertexToFaceGraph()[vIndex])
      .uniq()
      .value()
  }

  adjacentFaces(...vIndices) {
    return this.adjacentFaceIndices(...vIndices).map(
      fIndex => this.faces[fIndex],
    )
  }

  vertexToFaceGraph = _.memoize(() => {
    const mapping = this.vertices.map(() => [])
    this.faces.forEach((face, fIndex) => {
      face.forEach(vIndex => {
        mapping[vIndex].push(fIndex)
      })
    })
    return mapping
  })

  // return a new polyhedron with the given faces
  withFaces(faces) {
    return new Polyhedron(this.vertices, faces)
  }

  // Returns whether the set of vertices in this polyhedron are planar
  isPlanar(vIndices) {
    return isPlanar(_.at(this.vertexVectors(), vIndices))
  }

  // Returns whether the given polyhedron at vIndex is a pyramid
  isPyramid = vIndex => {
    const adjacentFaces = this.adjacentFaces(vIndex)
    if (!_.every(adjacentFaces, { length: 3 })) return false
    const boundary = getBoundary(adjacentFaces)
    return this.isPlanar(boundary)
  }

  // Get the vertex indices of the polyhedron that represent the tops of pyramids
  pyramidIndices() {
    return this.vIndices().filter(this.isPyramid)
  }

  isCupola = fIndex => {
    const face = this.faces[fIndex]
    const cupolaCount = _.countBy([3, 4, 4, face.length])
    // Ensure that each bounding vertex has the right faces
    const matchFaces = _.every(face, vIndex => {
      const nbrFaces = this.adjacentFaces(vIndex)
      const faceCount = _(nbrFaces)
        .map(numSides)
        .countBy()
        .value()
      if (!_.isEqual(faceCount, cupolaCount)) return false

      // Make sure that the square faces aren't adjacent
      const [sqFace1, sqFace2] = _.filter(
        nbrFaces,
        nbrFace => numSides(nbrFace) === 4 && !_.isEqual(nbrFace, face),
      )
      return !shareEdge(sqFace1, sqFace2)
    })

    if (!matchFaces) return false

    // make sure the whole thing is on a plane
    const allNeighborFaces = this.adjacentFaces(...face)
    const boundary = getBoundary(allNeighborFaces)
    return this.isPlanar(boundary)
  }

  cupolaIndices() {
    // Return the face indices of all the faces that are tops of cupolae
    // find the face in the polyhedron whose vertices' adjacent faces are <face>-4-3-4
    return this.fIndices().filter(this.isCupola)
  }
}
