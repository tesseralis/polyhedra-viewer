import * as _ from 'lodash'
import { Line3, Vector3 } from 'three'

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

function replace(array, index, ...values) {
  const before = _.take(array, index)
  const after = _.slice(array, index + 1)
  return [...before, ...values, ...after]
}

function nextVertex(face, vertex) {
  return face[(face.indexOf(vertex) + 1) % face.length]
}

function prevVertex(face, vertex) {
  return face[mod(face.indexOf(vertex) - 1, face.length)]
}

// Get faces that contain this vertex
function getTouchingFaces({ faces }, vertex) {
  const touchingFaces = _.filter(faces, face => _.includes(face, vertex))
  let toAdd = touchingFaces[0]
  const ordered = []
  do {
    ordered.push(toAdd)
    const nextFace = _.find(
      touchingFaces,
      face => prevVertex(face, vertex) === nextVertex(toAdd, vertex),
    )
    toAdd = nextFace
  } while (ordered.length < touchingFaces.length)
  return ordered
}

function replaceVertex(newPolyhedron, polyhedron, vertex, fraction) {
  const touchingFaces = getTouchingFaces(polyhedron, vertex)
  const touchingFaceIndices = touchingFaces.map(face =>
    polyhedron.faces.indexOf(face),
  )
  const verticesToAdd = touchingFaces.map(face => {
    const next = nextVertex(face, vertex)
    const p1 = new Vector3(...polyhedron.vertices[vertex])
    const p2 = new Vector3(...polyhedron.vertices[next])
    const line = new Line3(p1, p2)
    const sideLength = line.distance()
    const n = face.length
    const apothem =
      Math.cos(Math.PI / n) * sideLength / (2 * Math.sin(Math.PI / n))
    const n2 = 2 * n
    const newSideLength =
      2 * Math.sin(Math.PI / n2) * apothem / Math.cos(Math.PI / n2)
    return line.at(fraction * ((1 - newSideLength / sideLength) / 2)).toArray()
  })

  const newVertices = newPolyhedron.vertices.concat(verticesToAdd)

  const newFaces = newPolyhedron.faces
    .map((face, faceIndex) => {
      if (!_.includes(touchingFaceIndices, faceIndex)) return face
      const touchingFaceIndex = touchingFaceIndices.indexOf(faceIndex)
      return replace(
        face,
        face.indexOf(vertex),
        newPolyhedron.vertices.length +
          mod(touchingFaceIndex - 1, touchingFaces.length),
        newPolyhedron.vertices.length + touchingFaceIndex,
      )
    })
    .concat([_.rangeRight(newPolyhedron.vertices.length, newVertices.length)])
  return { faces: newFaces, vertices: newVertices }
  // TODO do edges if we end up caring about them
}

function removeExtraneousVertices(polyhedron) {
  let newVertices = polyhedron.vertices
  let newFaces = polyhedron.faces
  _.forEach(polyhedron.vertices, (vertex, index) => {
    if (_.every(polyhedron.faces, face => !_.includes(face, index))) {
      // replace the vertex with the last vertex and update all the faces
      const toReplace = newVertices.length - 1
      newVertices = _.initial(
        replace(newVertices, index, newVertices[toReplace]),
      )
      newFaces = newFaces.map(
        face =>
          _.includes(face, toReplace)
            ? replace(face, face.indexOf(toReplace), index)
            : face,
      )
    }
  })
  return { faces: newFaces, vertices: newVertices }
}

export function getTruncated(polyhedron, fraction = 1.0) {
  let newPolyhedron = polyhedron
  _.forEach(polyhedron.vertices, (vertex, index) => {
    newPolyhedron = replaceVertex(newPolyhedron, polyhedron, index, fraction)
  })
  return removeExtraneousVertices(newPolyhedron)
}
