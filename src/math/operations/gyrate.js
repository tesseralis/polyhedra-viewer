import _ from 'lodash'
import { vec, getCentroid, getNormal } from 'math/linAlg'
import Polyhedron from 'math/Polyhedron'
import { numSides, nextVertex } from 'math/solidUtils'

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
  const newVertices = polyhedron.vertices.map((vertex, vIndex) => {
    if (_.includes(peak.innerVertexIndices(), vIndex)) {
      return vec(vertex)
        .sub(centroid)
        .getRotatedAroundAxis(normal, theta)
        .add(centroid)
        .toArray()
    }
    return vertex
  })

  // Rotate all the points on the boundary
  // TODO this won't work with animation, so I have to reimplement eventually
  const newFaces = polyhedron.faces.map((face, fIndex) => {
    if (!_.includes(peak.faceIndices(), fIndex)) {
      return face
    }
    return face.map((vIndex, i) => {
      return _.includes(boundary, vIndex)
        ? nextVertex(boundary, vIndex)
        : vIndex
    })
  })

  return Polyhedron.of(newVertices, newFaces)
}
