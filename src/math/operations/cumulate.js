import _ from 'lodash'
import { geom } from 'toxiclibsjs'

import { getSingle } from 'util.js'
import Polyhedron from 'math/Polyhedron'
import { getMidpoint } from 'math/linAlg'
import { numSides } from 'math/solidUtils'
import { deduplicateVertices } from './operationUtils'
const { Line3D } = geom

export function cumulate(polyhedron, { faceType } = {}) {
  const { vertices, faces } = polyhedron
  const n = faceType || _.min(faces.map(numSides))
  const fIndices = polyhedron
    .fIndices()
    .filter(fIndex => numSides(faces[fIndex]) === n)
  const verticesToAdd = fIndices.map(fIndex => {
    const face = faces[fIndex]
    const sources = face.map(vIndex =>
      getSingle(_.difference(polyhedron.adjacentVertexIndices(vIndex), face)),
    )
    // FIXME this doesn't work for octahedron. Use faces instead
    const [v1, v2] = _.at(polyhedron.vertexVectors(), face)
    const [u1, u2] = _.at(polyhedron.vertexVectors(), sources)
    const l1 = new Line3D(v1, u1)
    const l2 = new Line3D(v2, u2)
    const intersection = l1.closestLineTo(l2).getLine()
    const newVertex = getMidpoint(intersection.a, intersection.b)
    return newVertex.toArray()
  })

  const oldToNew = {}
  fIndices.forEach((fIndex, i) => {
    faces[fIndex].forEach(vIndex => {
      oldToNew[vIndex] = i
    })
  })

  const newVertices = vertices.concat(verticesToAdd)

  const newFaces = faces.map(face => {
    return _.uniq(
      face.map(vIndex => {
        if (!_.has(oldToNew, vIndex)) return vIndex
        return oldToNew[vIndex] + polyhedron.numVertices()
      }),
    )
  })

  return deduplicateVertices(Polyhedron.of(newVertices, newFaces))
}
