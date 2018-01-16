import * as _ from 'lodash'
import { geom } from 'toxiclibsjs'
const { Vec3D } = geom

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

function replace(array, index, ...values) {
  const before = _.take(array, index)
  const after = _.slice(array, index + 1)
  return [...before, ...values, ...after]
}

function calculateCentroid(vectors) {
  return vectors.reduce((v1, v2) => v1.add(v2)).scale(1 / vectors.length)
}

function nextVertex(face, vertex) {
  return face[(face.indexOf(vertex) + 1) % face.length]
}

function prevVertex(face, vertex) {
  return face[mod(face.indexOf(vertex) - 1, face.length)]
}

const getFindFn = (toAdd, vertex) => face =>
  prevVertex(face, vertex) === nextVertex(toAdd, vertex)

// Get faces that contain this vertex
function getTouchingFaces({ faces }, vertex) {
  const touchingFaces = _.filter(faces, face => _.includes(face, vertex))
  let toAdd = touchingFaces[0]
  const ordered = []
  do {
    ordered.push(toAdd)
    const nextFace = _.find(touchingFaces, getFindFn(toAdd, vertex))
    toAdd = nextFace
  } while (ordered.length < touchingFaces.length)
  return ordered
}

function replaceVertex(newPolyhedron, polyhedron, vertex, { mock, rectify }) {
  const touchingFaces = getTouchingFaces(polyhedron, vertex)
  const touchingFaceIndices = touchingFaces.map(face =>
    polyhedron.faces.indexOf(face),
  )
  const verticesToAdd = touchingFaces.map(face => {
    if (mock) {
      return polyhedron.vertices[vertex]
    }
    const next = nextVertex(face, vertex)
    const p1 = new Vec3D(...polyhedron.vertices[vertex])
    const p2 = new Vec3D(...polyhedron.vertices[next])
    const sideLength = p1.distanceTo(p2)
    if (rectify) {
      return p1.add(p2.sub(p1).scale(1 / 2)).toArray()
    }
    const n = face.length
    const apothem =
      Math.cos(Math.PI / n) * sideLength / (2 * Math.sin(Math.PI / n))
    const n2 = 2 * n
    const newSideLength =
      2 * Math.sin(Math.PI / n2) * apothem / Math.cos(Math.PI / n2)
    return p1
      .add(p2.sub(p1).scale((sideLength - newSideLength) / 2 / sideLength))
      .toArray()
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

// Remove vertices (and faces) from the polyedron when they are all the same
// TODO implement
function deduplicateVertices(polyhedron) {
  // group vertex indices by same
  // replace vertices that are the same
  // remove duplicates in faces
  // remove extraneous faces
  // remove extraneous vertices
}

// get the edges associated with the given faces
function getEdges(faces) {
  return _.uniqWith(
    _.flatMap(faces, face => {
      return _.map(face, (vertex, index) => {
        return _.sortBy([vertex, face[(index + 1) % face.length]])
      })
    }),
    _.isEqual,
  )
}

export function getTruncated(polyhedron, options = {}) {
  let newPolyhedron = polyhedron
  _.forEach(polyhedron.vertices, (vertex, index) => {
    newPolyhedron = replaceVertex(newPolyhedron, polyhedron, index, options)
  })
  const flatPolyhedron = removeExtraneousVertices(newPolyhedron)
  // TODO deduplicate vertices when cantellating
  return { ...flatPolyhedron, edges: getEdges(flatPolyhedron.faces) }
}

export function _getElongated(
  polyhedron,
  {
    normalLength = _.identity,
    faceMap = [[0, 1, 2, 3]],
    transform = _.identity,
  } = {},
) {
  const { vertices, faces } = polyhedron
  // TODO this doesn't work on bipyramids etc.
  const faceToElongate = _.maxBy(faces, 'length')
  const n = faceToElongate.length
  const elongatedFaceIndex = faces.indexOf(faceToElongate)
  const verticesToElongate = faceToElongate.map(i => new Vec3D(...vertices[i]))

  // calculate the normal of the face
  const [v0, v1, v2] = verticesToElongate
  const sideLength = v0.distanceTo(v1)
  const normal = v0
    .sub(v1)
    .cross(v1.sub(v2))
    .getNormalizedTo(normalLength(sideLength))

  // add a new vertex for each new vertex in faceToElongate
  const origin = calculateCentroid(verticesToElongate)
  const theta = Math.PI / faceToElongate.length
  const verticesToAdd = _.map(verticesToElongate, v =>
    transform(v, { origin, normal, n })
      .add(normal)
      .toArray(),
  )
  const newVertices = vertices.concat(verticesToAdd)

  // add a new square face for each side
  const facesToAdd = _.flatMap(faceToElongate, (vIndex, fIndex) => {
    const faces = [
      vIndex,
      faceToElongate[(fIndex + 1) % n],
      vertices.length + (fIndex + 1) % n,
      vertices.length + fIndex,
    ]
    return faceMap.map(face => face.map(i => faces[i]))
  })
  // make the old face point to the new one
  const newFaces = replace(
    faces,
    elongatedFaceIndex,
    _.range(vertices.length, vertices.length + faceToElongate.length),
  ).concat(facesToAdd)
  console.log(newFaces)
  return { vertices: newVertices, faces: newFaces, edges: getEdges(newFaces) }
}

export function getElongated(polyhedron) {
  return _getElongated(polyhedron)
}

export function getGyroElongated(polyhedron) {
  return _getElongated(polyhedron, {
    normalLength: s => Math.sqrt(3) / 2 * s,
    transform: (v, { origin, normal, n }) =>
      v
        .sub(origin)
        .getRotatedAroundAxis(normal.getNormalized(), Math.PI / n)
        .add(origin),
    faceMap: [[0, 1, 3], [1, 2, 3]],
  })
}
