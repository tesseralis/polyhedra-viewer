import _ from 'lodash'
import { vec, getCentroid, getNormal } from 'math/linAlg'
import Polyhedron from 'math/Polyhedron'
import { numSides, nextVertex } from 'math/solidUtils'
import { deduplicateVertices } from './operationUtils'
import { mapObject } from 'util.js'

const TAU = 2 * Math.PI

export function gyrate(polyhedron, { peak }) {
  // get adjacent faces
  const boundary = peak.boundary()

  // rotate the cupola/rotunda top
  const boundaryVertices = boundary.map(
    vIndex => polyhedron.vertexVectors()[vIndex],
  )
  const normal = getNormal(boundaryVertices).getNormalized()
  const centroid = getCentroid(boundaryVertices)
  const theta = TAU / numSides(boundary)

  const newBoundaryVertices = boundary.map(
    vIndex => polyhedron.vertices[vIndex],
  )
  const oldToNew = mapObject(boundary, (vIndex, i) => [vIndex, i])

  // mock faces for animation
  const mockFaces = polyhedron.faces.map((face, fIndex) => {
    if (!_.includes(peak.faceIndices(), fIndex)) {
      return face
    }
    return face.map((vIndex, i) => {
      return _.includes(boundary, vIndex)
        ? polyhedron.numVertices() + oldToNew[vIndex]
        : vIndex
    })
  })

  const mockPolyhedron = Polyhedron.of(
    polyhedron.vertices.concat(newBoundaryVertices),
    mockFaces,
  )

  const newVertices = mockPolyhedron.vertices.map((vertex, vIndex) => {
    // FIXME make more elegant
    if (
      _.includes(peak.innerVertexIndices(), vIndex) ||
      vIndex >= polyhedron.numVertices()
    ) {
      return vec(vertex)
        .sub(centroid)
        .getRotatedAroundAxis(normal, theta)
        .add(centroid)
        .toArray()
    }
    return vertex
  })

  // FIXME something's broken also the interpolation doesn't work cause it's radial fuuuu
  return {
    animationData: {
      start: mockPolyhedron,
      endVertices: newVertices,
    },
    result: deduplicateVertices(mockPolyhedron.withVertices(newVertices)),
  }

  // // Rotate all the points on the boundary
  // // TODO this won't work with animation, so I have to reimplement eventually
  // const newFaces = polyhedron.faces.map((face, fIndex) => {
  //   if (!_.includes(peak.faceIndices(), fIndex)) {
  //     return face
  //   }
  //   return face.map((vIndex, i) => {
  //     return _.includes(boundary, vIndex)
  //       ? nextVertex(boundary, vIndex)
  //       : vIndex
  //   })
  // })

  // return Polyhedron.of(newVertices, newFaces)
}
