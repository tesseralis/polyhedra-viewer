import * as _ from 'lodash'
import { getSolidData } from 'constants/polyhedra'

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

// Get the element of the array at the given index,
// modulo the length
function getCyclic(array, index) {
  return array[mod(index, array.length)]
}

function getEdges(face) {
  return _.map(face, (vertex, index) => {
    return _.sortBy([vertex, getCyclic(face, index + 1)])
  })
}

function getAllEdges(faces) {
  return _.uniqWith(_.flatMap(faces, getEdges), _.isEqual)
}

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
}
