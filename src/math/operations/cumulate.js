import _ from 'lodash'

import { replace } from 'util.js'
import { vec } from 'math/linAlg'
import Polyhedron from 'math/Polyhedron'
import { numSides, prevVertex, nextVertex } from 'math/solidUtils'
import { deduplicateVertices } from './operationUtils'

export function getCumulatePolygon(polyhedron, point) {
  const hitPoint = vec(point)
  const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint)
  // TODO handle octahedron case
  const n = numSides(polyhedron.faces[hitFaceIndex])
  return n <= 5 ? n : -1
}

// Return if the polyhedron is rectified
function isRectified(polyhedron) {
  return polyhedron.adjacentFaceIndices(0).length === 4
}

function duplicateVertex(newPolyhedron, polyhedron, faceType, vIndex) {
  const adjacentFaceIndices = polyhedron.adjacentFaceIndices(vIndex)
  const pivot = _.find(
    adjacentFaceIndices,
    fIndex => polyhedron.numSides(fIndex) === faceType,
  )
  const pivotFace = polyhedron.faces[pivot]
  const newVertexIndex = newPolyhedron.numVertices()

  return newPolyhedron
    .addVertices([newPolyhedron.vertices[vIndex]])
    .mapFaces((face, fIndex) => {
      const originalFace = polyhedron.faces[fIndex]
      if (!_.includes(adjacentFaceIndices, fIndex)) {
        return face
      }

      // If this is the pivot face, return unchanged
      if (fIndex === pivot) {
        return face
      }

      // If this is the *other* cumulated face, use the duplicated vertex
      if (polyhedron.numSides(fIndex) === faceType) {
        return replace(face, face.indexOf(vIndex), newVertexIndex)
      }

      // If this is the face next to the pivot, insert the duplicated point to the left of the pivot
      if (_.includes(originalFace, nextVertex(pivotFace, vIndex))) {
        return replace(face, face.indexOf(vIndex), vIndex, newVertexIndex)
      }

      if (_.includes(originalFace, prevVertex(pivotFace, vIndex))) {
        return replace(face, face.indexOf(vIndex), newVertexIndex, vIndex)
      }

      throw new Error('Cannot classify face')
    })
}

function duplicateVertices(polyhedron, faceType) {
  const { vertices, faces } = polyhedron.vertices.reduce(
    (newPolyhedron, vertex, vIndex) => {
      return duplicateVertex(newPolyhedron, polyhedron, faceType, vIndex)
    },
    polyhedron,
  )
  // Create a new one so we recalculate the edges
  return Polyhedron.of(vertices, faces)
}

export function cumulate(polyhedron, { faceType } = {}) {
  if (isRectified(polyhedron)) {
    polyhedron = duplicateVertices(polyhedron, faceType)
  }
  const { vertices, faces } = polyhedron
  const n = faceType || _.min(faces.map(numSides))

  // face indices with the right number of sides
  const fIndices = polyhedron
    .fIndices()
    .filter(fIndex => numSides(faces[fIndex]) === n)

  const verticesToAdd = fIndices.map(fIndex => {
    const apothem = polyhedron.apothem(fIndex)
    const normal = polyhedron.faceNormal(fIndex)
    const centroid = vec(polyhedron.faceCentroid(fIndex))
    const theta =
      Math.PI - polyhedron.getDihedralAngle(_.take(polyhedron.faces[fIndex], 2))
    const scale = apothem * Math.tan(theta)
    return centroid.add(normal.scale(scale)).toArray()
  })

  const oldToNew = {}
  fIndices.forEach((fIndex, i) => {
    faces[fIndex].forEach(vIndex => {
      oldToNew[vIndex] = i
    })
  })

  const mockVertices = vertices.map(
    (vertex, vIndex) =>
      _.has(oldToNew, vIndex) ? verticesToAdd[oldToNew[vIndex]] : vertex,
  )

  return {
    animationData: {
      start: polyhedron,
      endVertices: mockVertices,
    },
    result: deduplicateVertices(polyhedron.withVertices(mockVertices)),
  }
}
