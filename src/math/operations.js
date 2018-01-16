import * as _ from 'lodash'
import { geom } from 'toxiclibsjs'
import { getSolidData } from 'constants/polyhedra'
const PRECISION = 1e-3

const { Vec3D } = geom

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

function replace(array, index, ...values) {
  const before = _.take(array, index)
  const after = _.slice(array, index + 1)
  return [...before, ...values, ...after]
}

function toVec3D(vertices) {
  return vertices.map(v => new Vec3D(...v))
}

function calculateCentroid(vectors) {
  return vectors.reduce((v1, v2) => v1.add(v2)).scale(1 / vectors.length)
}

// Get the normal of a polygon given its ordered vertices
function getNormal(vertices) {
  const [v0, v1, v2] = vertices
  return v0.sub(v1).cross(v1.sub(v2))
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

function removeExtraneousVertices({ vertices, faces }) {
  const toRemove = _.difference(_.range(vertices.length), _.flatMap(faces))

  // Map the tail end of the list to the ones to be removed
  const mapping = _.fromPairs(
    _.zip(
      _.rangeRight(vertices.length - toRemove.length, vertices.length),
      toRemove,
    ),
  )
  const revMapping = _.invert(mapping)
  const newFaces = faces.map(face =>
    face.map(vertex => {
      return _.has(mapping, vertex) ? mapping[vertex] : vertex
    }),
  )
  const newVertices = _.dropRight(
    vertices.map(
      (vertex, index) =>
        _.has(revMapping, index) ? vertices[revMapping[index]] : vertex,
    ),
  )
  return { faces: newFaces, vertices: newVertices }
}

// Remove vertices (and faces) from the polyhedron when they are all the same
// TODO implement
function deduplicateVertices(polyhedron) {
  // group vertex indices by same
  const vertices = toVec3D(polyhedron.vertices)
  const points = []
  const verticesByPoint = {}
  _.forEach(vertices, (vertex, index) => {
    const pointIndex = _.findIndex(points, point =>
      vertex.equalsWithTolerance(point, PRECISION),
    )
    if (pointIndex === -1) {
      points.push(vertex)
      verticesByPoint[points.length - 1] = [index]
    } else {
      verticesByPoint[pointIndex].push(index)
    }
  })

  // replace vertices that are the same
  let newFaces = polyhedron.faces
  _.forEach(verticesByPoint, groupedVertices => {
    if (groupedVertices.length <= 1) return
    newFaces = newFaces.map(face =>
      face.map(
        vertex =>
          _.includes(groupedVertices, vertex) ? groupedVertices[0] : vertex,
      ),
    )
  })
  // TODO do this for animation
  // remove duplicates in faces
  // remove extraneous faces

  // remove extraneous vertices
  return removeExtraneousVertices({
    faces: newFaces,
    vertices: polyhedron.vertices,
  })
}

function _getEdges(face) {
  return _.map(face, (vertex, index) => {
    return _.sortBy([vertex, face[(index + 1) % face.length]])
  })
}

// get the edges associated with the given faces
function getEdges(faces) {
  return _.uniqWith(_.flatMap(faces, _getEdges), _.isEqual)
}

function withEdges(polyhedron) {
  return { ...polyhedron, edges: getEdges(polyhedron.faces) }
}

export function getTruncated(polyhedron, options = {}) {
  let newPolyhedron = polyhedron
  _.forEach(polyhedron.vertices, (vertex, index) => {
    newPolyhedron = replaceVertex(newPolyhedron, polyhedron, index, options)
  })
  const flatPolyhedron = removeExtraneousVertices(newPolyhedron)
  // TODO deduplicate vertices when cantellating
  return withEdges(flatPolyhedron)
}

function elongateBi(polyhedron) {
  // find the base of the pyramid, polyhedron, or rotunda
  // push the vertices out
  // (can I just add a prism instead?)
}

function _getElongated(
  polyhedron,
  {
    // height of the elongation as a function of side length
    normalLength = _.identity,
    // transformation to apply before adding the normalLength
    transform = _.identity,
    // mapping of faces to generate in the elongated area
    faceMap = [[0, 1, 2, 3]],
  } = {},
) {
  const { vertices, faces } = polyhedron
  // TODO this doesn't work on bipyramids etc.
  const faceToElongate = _.maxBy(faces, 'length')
  const n = faceToElongate.length
  const elongatedFaceIndex = faces.indexOf(faceToElongate)
  const verticesToElongate = toVec3D(faceToElongate.map(i => vertices[i]))

  // calculate the normal of the face
  const [v0, v1] = verticesToElongate
  const sideLength = v0.distanceTo(v1)
  const normal = getNormal(verticesToElongate).getNormalizedTo(
    normalLength(sideLength),
  )

  // add a new vertex for each new vertex in faceToElongate
  const origin = calculateCentroid(verticesToElongate)
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
  return withEdges({ vertices: newVertices, faces: newFaces })
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

function faceGraph(polyhedron) {
  const edgesToFaces = {}
  // build up a lookup table for every pair of edges to that face
  _.forEach(polyhedron.faces, (face, index) => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    // ...this is n^2? more? ah who cares I'm too lazy
    _.forEach(_getEdges(face), edge => {
      if (!edgesToFaces[edge]) {
        edgesToFaces[edge] = []
      }
      // NOTE: this indexes the edge as a string (e.g. "1,2")
      edgesToFaces[edge].push(index)
    })
  })
  const graph = {}
  _.forEach(edgesToFaces, ([f1, f2]) => {
    if (!graph[f1]) graph[f1] = []
    if (!graph[f2]) graph[f2] = []
    graph[f1].push(f2)
    graph[f2].push(f1)
  })
  return graph
}

const augmentees = {
  3: 'tetrahedron',
  4: 'square-pyramid',
  5: 'pentagonal-pyramid',
  6: 'triangular-cupola',
  8: 'square-cupola',
  10: 'pentagonal-cupola',
}

// Augment the following
// TODO digonal cupola option and rotunda option; also reappropriate for elongation
function augment(polyhedron, faceIndex) {
  const base = polyhedron.faces[faceIndex]
  const n = base.length
  const baseVertices = toVec3D(base.map(index => polyhedron.vertices[index]))
  const baseCenter = calculateCentroid(baseVertices)
  const sideLength = baseVertices[0].distanceTo(baseVertices[1])
  const baseNormal = getNormal(baseVertices)

  const augmentee = getSolidData(augmentees[n])
  const augmenteeVertices = toVec3D(augmentee.vertices)
  // rotate and translate so that the face is next to our face
  const undersideIndex = _.findIndex(augmentee.faces, face => face.length === n)
  const undersideFace = augmentee.faces[undersideIndex]

  const undersideVertices = undersideFace.map(index => augmenteeVertices[index])
  const undersideNormal = getNormal(undersideVertices)
  const undersideCenter = calculateCentroid(undersideVertices)
  const augmenteeSideLength = undersideVertices[0].distanceTo(
    undersideVertices[1],
  )

  const alignBasesNormal = undersideNormal.cross(baseNormal).getNormalized()
  const alignBasesAngle = baseNormal.angleBetween(undersideNormal, true)

  const alignedAugmenteeVertices = augmenteeVertices.map(v => {
    return v
      .sub(undersideCenter)
      .scale(sideLength / augmenteeSideLength)
      .getRotatedAroundAxis(alignBasesNormal, alignBasesAngle - Math.PI)
  })

  // FIXME still wrong...
  const translatedV0 = baseVertices[0].sub(baseCenter)
  const alignedV0 = alignedAugmenteeVertices[undersideFace[0]]
  // align the first vertex of the base face to the first vertex of the underside face
  const alignVerticesAngle = translatedV0.angleBetween(alignedV0, true)
  const transformedAugmenteeVertices = alignedAugmenteeVertices.map(v => {
    return v
      .getRotatedAroundAxis(
        alignedV0.cross(translatedV0).getNormalized(),
        alignVerticesAngle,
      )
      .add(baseCenter)
  })

  // append the faces and vertices
  const newVertices = polyhedron.vertices.concat(
    transformedAugmenteeVertices.map(v => v.toArray()),
  )
  const newFaces = _.filter(
    polyhedron.faces.concat(
      augmentee.faces.map(face =>
        face.map(index => index + polyhedron.vertices.length),
      ),
    ),
    // remove the two glued faces
    (face, index) =>
      index !== faceIndex && index !== polyhedron.faces.length + undersideIndex,
  )

  // remove extraneous vertices
  return deduplicateVertices({ vertices: newVertices, faces: newFaces })
}

export function getAugmented(polyhedron, name) {
  // only do the "main" class right now
  // Determine whether we're a (augmented) prism or an archimedean solid or dodecahedron
  // use the graph and the para/meta option to determine which face we should augment to
  // (do meta for now)
  const graph = faceGraph(polyhedron)
  const faceIndex = 0
  // (special case: triangular prism)
  // do the augmentation
  return withEdges(augment(polyhedron, faceIndex))
}
