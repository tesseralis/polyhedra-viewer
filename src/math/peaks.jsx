import _ from 'lodash'
import { getBoundary } from './solidUtils'

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

  topPoint() {}

  faceConfiguration() {}

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
    const matchFaces = _.every(this.innerVertexIndices(), vIndex => {
      const faceCount = this.polyhedron.adjacentFaceCount(vIndex)
      return _.isEqual(faceCount, this.faceConfiguration())
    })
    return matchFaces && this.polyhedron.isPlanar(this.boundary())
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

  faceConfiguration = () => ({ 3: this.faces().length })

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

  faceConfiguration = () => ({ 3: 1, 4: 2 })

  topPoint() {
    const [v1, v2] = this.edge.map(v => this.polyhedron.vertexVectors()[v])
    const midpoint = v1.add(v2).scale(0.5)
    return midpoint.toArray()
  }
}

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

  faceConfiguration = () =>
    _.countBy([3, 4, 4, this.innerVertexIndices().length])

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

  faceConfiguration = () => ({ 5: 2, 3: 2 })

  topPoint() {
    return this.polyhedron.faceCentroid(this.fIndex)
  }
}
