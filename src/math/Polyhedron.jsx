import _ from 'lodash'
import { isValidSolid, getSolidData } from 'data'
import {
  vec,
  getMidpoint,
  isPlanar,
  getPlane,
  getNormal,
  getCentroid,
  PRECISION,
} from './linAlg'
import Peak from './Peak'
import { numSides, getCyclic } from './solidUtils'

function getEdges(face) {
  return _.map(face, (vertex, index) => {
    return _.sortBy([vertex, getCyclic(face, index + 1)])
  })
}

function getAllEdges(faces) {
  return _.uniqWith(_.flatMap(faces, getEdges), _.isEqual)
}

// NOTE: this file is .jsx because otherwise class properties won't be highlighted in sublime
export default class Polyhedron {
  static get(name) {
    if (!isValidSolid(name)) {
      throw new Error(`Invalid solid name: ${name}`)
    }
    return new Polyhedron({ ...getSolidData(name), name })
  }

  static of(vertices, faces) {
    return new Polyhedron({ vertices, faces })
  }

  constructor({ vertices, faces, edges, name }) {
    this.vertices = vertices
    this.faces = faces
    if (edges) {
      this._edges = edges
    }
    if (name) {
      this.name = name
    }
  }

  get edges() {
    if (!this._edges) {
      this._edges = getAllEdges(this.faces)
    }
    return this._edges
  }

  toJSON() {
    return _.pick(this, ['vertices', 'faces', 'edges', 'name'])
  }

  numVertices() {
    return this.vertices.length
  }

  numFaces() {
    return this.faces.length
  }

  numSides(fIndex) {
    return numSides(this.faces[fIndex])
  }

  numUniqueSides(fIndex) {
    const face = this.faces[fIndex]
    const faceVertices = _.at(this.vertexVectors(), face)
    const uniqueVertices = _.filter(faceVertices, (vertex, i) => {
      return !vertex.equalsWithTolerance(
        faceVertices[(i + 1) % faceVertices.length],
        PRECISION,
      )
    })
    return uniqueVertices.length
  }

  vIndices() {
    return _.range(this.numVertices())
  }

  fIndices() {
    return _.range(this.numFaces())
  }

  // Return the number of each type of faces of each face
  faceCount() {
    return _.countBy(this.faces, numSides)
  }

  // Return the vectors of this polyhedron as vectors
  vertexVectors = _.memoize(() => this.vertices.map(vec))

  edgeLength() {
    const [v0, v1] = _.at(this.vertexVectors(), this.faces[0])
    return v0.distanceTo(v1)
  }

  // get the apothem of the given face
  apothem(fIndex) {
    return this.edgeLength() / (2 * Math.tan(Math.PI / this.numSides(fIndex)))
  }

  // Return the faces adjacent to the given vertices
  adjacentFaceIndices(...vIndices) {
    return _(vIndices)
      .flatMap(_.propertyOf(this.vertexToFaceGraph()))
      .uniq()
      .value()
  }

  adjacentFaces(...vIndices) {
    return _.at(this.faces, this.adjacentFaceIndices(...vIndices))
  }

  // Return the number of faces by side for the given vertex
  adjacentFaceCount(vIndex) {
    return _.countBy(this.adjacentFaces(vIndex), numSides)
  }

  // Get the vertices adjacent to this set of vertices
  adjacentVertexIndices(...vIndices) {
    return _(vIndices)
      .flatMap(_.propertyOf(this.vertexGraph()))
      .uniq()
      .value()
  }

  vertexGraph = _.memoize(() => {
    const graph = {}
    _.forEach(this.faces, face => {
      _.forEach(face, (vIndex, i) => {
        if (!graph[vIndex]) {
          graph[vIndex] = []
        }
        graph[vIndex].push(getCyclic(face, i + 1))
      })
    })
    return graph
  })

  vertexToFaceGraph = _.memoize(() => {
    const mapping = this.vertices.map(() => [])
    this.faces.forEach((face, fIndex) => {
      face.forEach(vIndex => {
        mapping[vIndex].push(fIndex)
      })
    })
    return mapping
  })

  // return a new polyhedron with the given vertices
  withVertices(vertices) {
    return new Polyhedron({ ...this.toJSON(), vertices })
  }

  // return a new polyhedron with the given faces
  withFaces(faces) {
    return new Polyhedron({ ...this.toJSON(), faces })
  }

  withName(name) {
    return new Polyhedron({ ...this.toJSON(), name })
  }

  // Returns whether the set of vertices in this polyhedron are planar
  isPlanar(vIndices) {
    return isPlanar(_.at(this.vertexVectors(), vIndices))
  }

  /** Return the centroid of the face given by the face index */
  faceCentroid(fIndex) {
    return getCentroid(
      this.faces[fIndex].map(vIndex => this.vertexVectors()[vIndex]),
    ).toArray()
  }

  /** Return the normal of the face given by the face index */
  faceNormal(fIndex) {
    return getNormal(
      _.at(this.vertexVectors(), this.faces[fIndex]),
    ).getNormalized()
  }

  getDihedralAngle(edge) {
    const [v1, v2] = edge.map(vIndex => this.vertexVectors()[vIndex])
    const midpoint = getMidpoint(v1, v2)
    const [c1, c2] = this.faces
      .filter(face => _.intersection(face, edge).length === 2)
      .map(face =>
        getCentroid(face.map(vIndex => this.vertexVectors()[vIndex])),
      )
      .map(v => v.sub(midpoint))

    if (!c1 || !c2) {
      // throw new Error(`The edge ${edge} is not connected to two faces.`)
      return 2 * Math.PI
    }

    return c1.angleBetween(c2, true)
  }

  faceGraph = _.memoize(() => {
    const edgesToFaces = {}
    // build up a lookup table for every pair of edges to that face
    _.forEach(this.faces, (face, index) => {
      // for the pairs of vertices, find the face that contains the corresponding pair
      // ...this is n^2? more? ah who cares I'm too lazy
      _.forEach(getEdges(face), edge => {
        if (!edgesToFaces[edge]) {
          edgesToFaces[edge] = []
        }
        // NOTE: this indexes the edge as a string (e.g. "1,2")
        edgesToFaces[edge].push(index)
      })
    })
    const graph = {}
    _.forEach(edgesToFaces, ([f1, f2]) => {
      if (!graph[f1]) graph[f1] = []
      if (!graph[f2]) graph[f2] = []
      graph[f1].push(f2)
      graph[f2].push(f1)
    })
    return graph
  })

  faceAdjacencyList() {
    const faceAdjacencyCounts = _.map(this.faceGraph(), (adjFaces, fIndex) => ({
      n: numSides(this.faces[fIndex]),
      adj: _.countBy(adjFaces, fIndex2 => numSides(this.faces[fIndex2])),
    }))
    return _.sortBy(
      faceAdjacencyCounts,
      ['n', 'adj.length'].concat([3, 4, 5, 6, 8, 10].map(n => `adj[${n}]`)),
    )
  }

  isSame(other) {
    if (!_.isEqual(this.faceCount(), other.faceCount())) return false
    return _.isEqual(this.faceAdjacencyList(), other.faceAdjacencyList())
  }

  /**
   * Center the polyhedron on its centroid.
   */
  center() {
    const centroid = getCentroid(this.vertexVectors())
    return this.withVertices(
      this.vertexVectors().map(v => v.sub(centroid).toArray()),
    )
  }

  hitFaceIndex(point) {
    return _.minBy(this.fIndices(), fIndex => {
      const face = this.faces[fIndex]
      const plane = getPlane(_.at(this.vertexVectors(), face))
      return plane.getDistanceToPoint(point)
    })
  }

  peaks = () => {
    return Peak.getAll(this)
  }

  findPeak(point) {
    const hitPoint = vec(point)
    const hitFaceIndex = this.hitFaceIndex(hitPoint)
    const peaks = this.peaks().filter(peak =>
      _.includes(peak.faceIndices(), hitFaceIndex),
    )
    if (peaks.length === 0) {
      return null
    }
    return _.minBy(peaks, peak => vec(peak.topPoint()).distanceTo(hitPoint))

    // return nearestPeak.innerVertexIndices()
  }
}
