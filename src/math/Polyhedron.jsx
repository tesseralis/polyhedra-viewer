import _ from 'lodash'
import { getSolidData } from 'constants/polyhedra'
import { vec, isPlanar, getPlane } from './linAlg'

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

export function getDirectedEdges(face) {
  return _.map(face, (vertex, index) => {
    return [vertex, getCyclic(face, index + 1)]
  })
}

// Return the number of sides of a face
export const numSides = face => face.length

// Return if the two faces share an edge
const shareEdge = (face1, face2) => _.intersection(face1, face2).length === 2

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
      .flatMap(_.propertyOf(this.vertexToFaceGraph()))
      .uniq()
      .value()
  }

  adjacentFaces(...vIndices) {
    return this.adjacentFaceIndices(...vIndices).map(_.propertyOf(this.faces))
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

  cupolaFaceIndices = fIndex => this.adjacentFaceIndices(...this.faces[fIndex])

  isCupola = fIndex => {
    const face = this.faces[fIndex]
    const cupolaCount = _.countBy([3, 4, 4, numSides(face)])
    // Ensure that each bounding vertex has the right faces
    const matchFaces = _.every(face, vIndex => {
      const faceCount = this.adjacentFaceCount(vIndex)
      if (!_.isEqual(faceCount, cupolaCount)) return false

      // Make sure that the square faces aren't adjacent
      const [sqFace1, sqFace2] = _.filter(
        this.adjacentFaces(vIndex),
        nbrFace => numSides(nbrFace) === 4 && !_.isEqual(nbrFace, face),
      )
      return !shareEdge(sqFace1, sqFace2)
    })

    if (!matchFaces) return false

    // make sure the whole thing is on a plane
    const allNeighborFaces = this.adjacentFaces(...face)
    return this.isPlanar(getBoundary(allNeighborFaces))
  }

  rotundaFaceIndices = fIndex =>
    this.adjacentFaceIndices(
      ...this.adjacentVertexIndices(...this.faces[fIndex]),
    )

  isRotunda = fIndex => {
    const face = this.faces[fIndex]
    const nbrIndices = this.adjacentVertexIndices(...face)
    const rotundaCount = { 5: 2, 3: 2 }
    const matchFaces = _.every(nbrIndices, vIndex => {
      const faceCount = this.adjacentFaceCount(vIndex)
      return _.isEqual(faceCount, rotundaCount)
    })
    if (!matchFaces) return false
    const nbrFaces = this.adjacentFaces(...nbrIndices)
    return this.isPlanar(getBoundary(nbrFaces))
  }

  // Get the vertex indices of the polyhedron that represent the tops of pyramids
  pyramidIndices() {
    return this.vIndices().filter(this.isPyramid)
  }

  cupolaIndices() {
    // Return the face indices of all the faces that are tops of cupolae
    // find the face in the polyhedron whose vertices' adjacent faces are <face>-4-3-4
    return this.fIndices().filter(this.isCupola)
  }

  rotundaIndices() {
    return this.fIndices().filter(this.isRotunda)
  }

  hitFaceIndex(point) {
    return _.minBy(this.fIndices(), fIndex => {
      const face = this.faces[fIndex]
      const plane = getPlane(_.at(this.vertexVectors(), face))
      return plane.getDistanceToPoint(point)
    })
  }
  /**
 * Find the nearest pyramid, cupola, or rotunda in the solid to the provided hit point.
 * Return the "peak" vertices, or null if the point is not part of any peak.
 * @param exclude a list of codes for solids to exclude (Y, U, R)
 */
  findPeak(point, exclude = {}) {
    const { faces, vertices } = this
    const hitPoint = vec(point)
    const hitFaceIndex = this.hitFaceIndex(hitPoint)
    console.log('hitFaceIndex', hitFaceIndex)
    const pyramidIndices = _.includes(exclude, 'Y') ? [] : this.pyramidIndices()

    // A solid can have only pyramids or cupolae/rotundae, so it suffices to check for one
    if (pyramidIndices.length > 0) {
      // check if we're inside any pyramid
      const pyramidFaces = _.flatMap(pyramidIndices, vIndex =>
        this.adjacentFaceIndices(vIndex),
      )
      if (!_.includes(pyramidFaces, hitFaceIndex)) {
        return null
      }

      const nearestPeak = _.minBy(pyramidIndices, vIndex => {
        const vertex = vec(vertices[vIndex])
        return vertex.distanceTo(hitPoint)
      })
      return [nearestPeak]
    }

    // Cupolae and rotundae
    const cupolaIndices = _.includes(exclude, 'U')
      ? []
      : this.cupolaIndices().filter(fIndex =>
          _.includes(this.cupolaFaceIndices(fIndex), hitFaceIndex),
        )

    const rotundaIndices = _.includes(exclude, 'R')
      ? []
      : this.rotundaIndices().filter(fIndex =>
          _.includes(this.rotundaFaceIndices(fIndex), hitFaceIndex),
        )

    // check if we're inside any cupola or rotunda
    if (cupolaIndices.length + rotundaIndices.length === 0) {
      return null
    }

    // if so, determine the closest cupola point to this
    const nearestPeak = _.minBy(
      cupolaIndices.concat(rotundaIndices),
      fIndex => {
        const plane = getPlane(_.at(this.vertexVectors(), faces[fIndex]))
        return plane.getDistanceToPoint(hitPoint)
      },
    )

    return _.includes(cupolaIndices, nearestPeak)
      ? faces[nearestPeak]
      : this.adjacentVertexIndices(...faces[nearestPeak])
  }
}
