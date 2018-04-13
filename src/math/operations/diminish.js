import _ from 'lodash'

import { removeExtraneousVertices } from './operationUtils'
import Peak from 'math/Peak'
import { numSides } from 'math/solidUtils'

function removeVertices(polyhedron, peak) {
  const newFaces = polyhedron.faces.concat([peak.boundary()])
  _.pullAt(newFaces, peak.faceIndices())
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

export function diminish(polyhedron, { peak }) {
  return removeVertices(polyhedron, peak)
}

export function shorten(polyhedron) {
  // Find a prism or antiprism face
  const face = _(polyhedron.faces)
    .filter((face, fIndex) => {
      const adjacentFace = polyhedron.faceGraph()[fIndex]
      const adjacent = adjacentFace.map(fIndex2 => polyhedron.faces[fIndex2])
      return _.keys(_.countBy(adjacent, numSides)).length === 1
    })
    .maxBy(numSides)
  return removeVertices(polyhedron, new Peak(polyhedron, face))
}
