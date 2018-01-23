import _ from 'lodash'
import { getSolidData } from 'constants/polyhedra'

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

  vIndices() {
    return _.range(this.numVertices())
  }

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
}
