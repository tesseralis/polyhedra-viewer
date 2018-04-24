import _ from 'lodash'
import { geom } from 'toxiclibsjs'

import { getSingle } from 'util.js'
import Polyhedron from 'math/Polyhedron'
import { vec, getMidpoint } from 'math/linAlg'
import { numSides } from 'math/solidUtils'
import { deduplicateVertices } from './operationUtils'
const { Line3D } = geom

export function getCumulatePolygon(polyhedron, point) {
  const hitPoint = vec(point)
  const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint)
  // TODO handle octahedron case
  const n = numSides(polyhedron.faces[hitFaceIndex])
  return n <= 5 ? n : -1
}

export function cumulate(polyhedron, { faceType } = {}) {
  const { vertices, faces } = polyhedron
  const n = faceType || _.min(faces.map(numSides))

  // face indices with the right number of sides
  const fIndices = polyhedron
    .fIndices()
    .filter(fIndex => numSides(faces[fIndex]) === n)

  const verticesToAdd = fIndices.map(fIndex => {
    const s = polyhedron.edgeLength()
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
