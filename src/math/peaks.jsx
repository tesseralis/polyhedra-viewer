import _ from 'lodash'
// FIXME dedupe
// Get the element of the array at the given index,
// modulo its length
function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}
export function getCyclic(array, index) {
  return array[mod(index, array.length)]
}
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

export class Peak {
  static getAll(polyhedron) {
    const pyramids = Pyramid.getAll(polyhedron)
    if (pyramids.length > 0) return pyramids

    const fastigium = Fastigium.getAll(polyhedron)
    if (fastigium.length > 0) return fastigium

    const cupolaRotunda = Cupola.getAll(polyhedron).concat(
      Rotunda.getAll(polyhedron),
    )
    if (cupolaRotunda.length > 0) return cupolaRotunda
    return []
  }

  constructor(polyhedron, type) {
    this.polyhedron = polyhedron
    this.type = type
  }

  innerVertexIndices() {}

  _isValid() {}

  topPoint() {}

  faceIndices = _.memoize(() => {
    return this.polyhedron.adjacentFaceIndices(...this.innerVertexIndices())
  })

  faces = _.memoize(() => {
    return this.polyhedron.adjacentFaces(...this.innerVertexIndices())
  })

  boundary = _.memoize(() => {
    return getBoundary(this.faces())
  })

  isValid() {
    return this._isValid() && this.polyhedron.isPlanar(this.boundary())
  }
}
export class Pyramid extends Peak {
  static getAll(polyhedron) {
    return polyhedron
      .vIndices()
      .map(vIndex => new Pyramid(polyhedron, vIndex))
      .filter(peak => peak.isValid())
  }

  constructor(polyhedron, vIndex) {
    super(polyhedron, 'pyramid')
    this.vIndex = vIndex
  }

  innerVertexIndices() {
    return [this.vIndex]
  }

  _isValid() {
    return _.every(this.faces(), { length: 3 })
  }

  topPoint() {
    return this.polyhedron.vertices[this.vIndex]
  }
}

export class Fastigium extends Peak {
  static getAll(polyhedron) {
    return polyhedron.edges
      .map(edge => new Fastigium(polyhedron, edge))
      .filter(peak => peak.isValid())
  }

  constructor(polyhedron, edge) {
    super(polyhedron, 'fastigium')
    this.edge = edge
  }

  innerVertexIndices() {
    return this.edge
  }

  _isValid() {
    const fastigiumCount = { 3: 1, 4: 2 }
    return _.every(this.edge, vIndex => {
      const faceCount = this.polyhedron.adjacentFaceCount(vIndex)
      return _.isEqual(faceCount, fastigiumCount)
    })
  }

  topPoint() {
    const [v1, v2] = this.edge.map(v => this.polyhedron.vertexVectors()[v])
    const midpoint = v1.add(v2).scale(0.5)
    return midpoint.toArray()
  }
}

// const shareEdge = (face1, face2) => _.intersection(face1, face2).length === 2

export class Cupola extends Peak {
  static getAll(polyhedron) {
    return polyhedron
      .fIndices()
      .map(fIndex => new Cupola(polyhedron, fIndex))
      .filter(peak => peak.isValid())
  }

  constructor(polyhedron, fIndex) {
    super(polyhedron, 'cupola')
    this.fIndex = fIndex
  }

  innerVertexIndices = _.memoize(() => {
    return this.polyhedron.faces[this.fIndex]
  })

  _isValid() {
    const face = this.innerVertexIndices()
    const cupolaCount = _.countBy([3, 4, 4, face.length])
    // Ensure that each bounding vertex has the right faces
    return _.every(face, vIndex => {
      const faceCount = this.polyhedron.adjacentFaceCount(vIndex)
      return _.isEqual(faceCount, cupolaCount)
    })
  }

  topPoint() {
    return this.polyhedron.faceCentroid(this.fIndex)
  }
}

export class Rotunda extends Peak {
  static getAll(polyhedron) {
    return polyhedron
      .fIndices()
      .map(fIndex => new Rotunda(polyhedron, fIndex))
      .filter(peak => peak.isValid())
  }

  constructor(polyhedron, fIndex) {
    super(polyhedron, 'rotunda')
    this.fIndex = fIndex
  }

  innerVertexIndices = _.memoize(() => {
    return this.polyhedron.adjacentVertexIndices(
      ...this.polyhedron.faces[this.fIndex],
    )
  })

  _isValid() {
    const nbrIndices = this.innerVertexIndices()
    const rotundaCount = { 5: 2, 3: 2 }
    return _.every(nbrIndices, vIndex => {
      const faceCount = this.polyhedron.adjacentFaceCount(vIndex)
      return _.isEqual(faceCount, rotundaCount)
    })
  }

  topPoint() {
    return this.polyhedron.faceCentroid(this.fIndex)
  }
}
