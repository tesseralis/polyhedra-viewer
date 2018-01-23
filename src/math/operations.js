import _ from 'lodash'
import Polyhedron, { getBoundary } from './Polyhedron'
import { vec, getPlane, PRECISION } from './linAlg'

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

// get the element in the array mod the array's length
function getMod(array, index) {
  return array[mod(index, array.length)]
}

function replace(array, index, ...values) {
  const before = _.take(array, index)
  const after = _.slice(array, index + 1)
  return [...before, ...values, ...after]
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
  return getMod(face, face.indexOf(vertex) + 1)
}

function prevVertex(face, vertex) {
  return getMod(face, face.indexOf(vertex) - 1)
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
    const p1 = vec(polyhedron.vertices[vertex])
    const p2 = vec(polyhedron.vertices[next])
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
  return new Polyhedron(newVertices, newFaces)
}

function removeExtraneousVertices(polyhedron) {
  const { vertices, faces } = polyhedron
  // Vertex indices to remove
  const toRemove = _.difference(polyhedron.vIndices(), _.flatMap(faces))
  const numToRemove = toRemove.length

  // Map the `numToRemove` last vertices of the polyhedron (that don't overlap)
  // to the first few removed vertices
  const newToOld = _(polyhedron.vIndices())
    .takeRight(numToRemove)
    .difference(toRemove)
    .map((vIndex, i) => [vIndex, toRemove[i]])
    .fromPairs()
    .value()
  const oldToNew = _.invert(newToOld)

  const newVertices = _(vertices)
    .map((vertex, vIndex) => vertices[_.get(oldToNew, vIndex, vIndex)])
    .dropRight(numToRemove)
    .value()
  const newFaces = faces.map(face =>
    face.map(vIndex => _.get(newToOld, vIndex, vIndex)),
  )
  return new Polyhedron(newVertices, newFaces)
}

// Remove vertices (and faces) from the polyhedron when they are all the same
function deduplicateVertices(polyhedron) {
  // group vertex indices by same
  const vertices = polyhedron.vertices.map(vec)
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
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

export function getTruncated(polyhedron, options = {}) {
  let newPolyhedron = polyhedron
  _.forEach(polyhedron.vertices, (vertex, index) => {
    newPolyhedron = replaceVertex(newPolyhedron, polyhedron, index, options)
  })
  // TODO remove duplicate vertices when cantellating
  return removeExtraneousVertices(newPolyhedron)
}

function vertexGraph(polyhedron) {
  const graph = {}
  _.forEach(polyhedron.faces, face => {
    _.forEach(face, (vIndex, i) => {
      if (!graph[vIndex]) {
        graph[vIndex] = []
      }
      graph[vIndex].push(getMod(face, i + 1))
    })
  })
  return graph
}

function faceGraph(polyhedron) {
  const edgesToFaces = {}
  // build up a lookup table for every pair of edges to that face
  _.forEach(polyhedron.faces, (face, index) => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    // ...this is n^2? more? ah who cares I'm too lazy
    _.forEach(polyhedron.edges, edge => {
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

const augmentTypes = {
  pyramidsCupolae: {
    3: 'tetrahedron',
    4: 'square-pyramid',
    5: 'pentagonal-pyramid',
    6: 'triangular-cupola',
    8: 'square-cupola',
    10: 'pentagonal-cupola',
  },

  prisms: {
    3: 'triangular-prism',
    4: 'cube',
    5: 'pentagonal-prism',
    6: 'hexagonal-prism',
    8: 'octagonal-prism',
    10: 'decagonal-prism',
  },

  antiprisms: {
    3: 'octahedron',
    4: 'square-antiprism',
    5: 'pentagonal-antiprism',
    6: 'hexagonal-antiprism',
    8: 'octagonal-antiprism',
    10: 'decagonal-antiprism',
  },
}

const augmentData = _.mapValues(augmentTypes, type =>
  _.mapValues(type, Polyhedron.get),
)

function getDihedralAngle({ faces, vertices }, edge) {
  const [v1, v2] = edge.map(vIndex => vec(vertices[vIndex]))
  const midpoint = v1.add(v2).scale(0.5)

  const [c1, c2] = faces
    .filter(face => _.intersection(face, edge).length === 2)
    .map(face => calculateCentroid(face.map(vIndex => vec(vertices[vIndex]))))
    .map(v => v.sub(midpoint))

  return c1.angleBetween(c2, true)
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugment(polyhedron, faceIndex, { offset = 0 } = {}) {
  const base = polyhedron.faces[faceIndex]
  const n = base.length

  const augmentee = augmentData['pyramidsCupolae'][n]
  const undersideIndex = _.findIndex(augmentee.faces, face => face.length === n)
  const undersideFace = augmentee.faces[undersideIndex]

  return _.every(base, (baseV1, i) => {
    const baseV2 = getMod(base, i + 1)
    const baseAngle = getDihedralAngle(polyhedron, [baseV1, baseV2])

    // todo doesn't work on cupolae
    const undersideV1 = getMod(undersideFace, i + offset)
    const undersideV2 = getMod(undersideFace, i - 1 + offset)
    const augmenteeAngle = getDihedralAngle(augmentee, [
      undersideV1,
      undersideV2,
    ])

    return baseAngle + augmenteeAngle < Math.PI - PRECISION
  })
}

const sharesVertex = (face1, face2) => {
  const intersectionCount = _.intersection(face1, face2).length
  // Make sure they're not the same face
  return intersectionCount > 0 && intersectionCount < face1.length
}
const numSides = face => face.length

// Computes the set equality of two arrays
const setEquals = (array1, array2) => _.xor(array1, array2).length === 0

// Get what kind of base we are augmenting to
function getBaseType(faces, base) {
  const adjacentFaceCounts = _(faces)
    .filter(face => sharesVertex(face, base))
    .map(numSides)
    .uniq()
    .value()
  if (setEquals(adjacentFaceCounts, [3, 4])) {
    return 'cupola'
  } else if (setEquals(adjacentFaceCounts, [4])) {
    return 'prism'
  } else if (setEquals(adjacentFaceCounts, [3])) {
    return 'antiprism'
  } else if (setEquals(adjacentFaceCounts, [3, 5])) {
    return 'cupola'
  } else if (setEquals(adjacentFaceCounts, [4, 5])) {
    return 'rhombicosidodecahedron'
  } else {
    return 'truncated'
  }
}

function hasDirectedEdge(face, edge) {
  const [u1, u2] = edge
  return _.some(face, (v1, i) => {
    const v2 = getMod(face, i + 1)
    return u1 === v1 && u2 === v2
  })
}

// Get the face in the polyhedron with the given directed edge
function getFaceWithDirectedEdge(faces, edge) {
  return _.find(faces, face => hasDirectedEdge(face, edge))
}

// Get the opposite side of the given prism base
// ensuring that the vertex indices match up
function getOppositePrismSide(polyhedron, base) {
  const graph = vertexGraph(polyhedron)
  return _.map(base, vIndex => {
    // Get the neighbor of each vertex that isn't also in the prism
    const nbrs = graph[vIndex]
    return _.find(nbrs, vIndex => _.includes(base, vIndex))
  })
}

// TODO handle rhombicosidodecahedron case (still don't know what terminology I want to use)
// Get the index in the augmentee underside to align with the base's 0th vertex
function getAlignIndex(polyhedron, base, augmentee, underside, gyrate) {
  // TODO handle gyrobifastigium
  if (numSides(base) <= 5) return 0
  const baseType = getBaseType(polyhedron.faces, base)
  if (baseType === 'antiprism') {
    return 0
  }

  if (baseType === 'prism' && polyhedron.cupolaIndices().length === 0) {
    return 0
  }

  if (baseType !== 'truncated' && _.isNil(gyrate)) {
    throw new Error(`Must define 'gyrate' for augmenting ${baseType} `)
  }

  const faceToCheck =
    baseType === 'prism' ? getOppositePrismSide(polyhedron, base) : base

  const adjFace = getFaceWithDirectedEdge(polyhedron.faces, [
    faceToCheck[1],
    faceToCheck[0],
  ])
  const alignedFace = getFaceWithDirectedEdge(augmentee.faces, [
    _.last(underside),
    underside[0],
  ])

  // It's orthogonal if triangle faces are aligned or non-triangle faces are aligned
  const isOrtho = (numSides(adjFace) !== 3) === (numSides(alignedFace) !== 3)

  if (baseType === 'truncated') {
    return isOrtho ? 0 : 1
  }
  return isOrtho && gyrate === 'ortho' ? 1 : 0
}

// Augment the following
// TODO digonal cupola option and rotunda option
function doAugment(polyhedron, faceIndex, type, gyrate) {
  const { faces, vertices } = polyhedron
  const base = faces[faceIndex]
  const n = base.length
  const baseVertices = base.map(index => vec(vertices[index]))
  const baseCenter = calculateCentroid(baseVertices)
  const sideLength = baseVertices[0].distanceTo(baseVertices[1])
  const baseNormal = getNormal(baseVertices)

  const augmentee = augmentData[type][n]
  const augmenteeVertices = augmentee.vertices.map(vec)
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

  const translatedV0 = baseVertices[0].sub(baseCenter)
  const alignIndex = getAlignIndex(
    polyhedron,
    base,
    augmentee,
    undersideFace,
    gyrate,
  )
  const alignedV0 = alignedAugmenteeVertices[undersideFace[alignIndex]]
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
  const newFaces = polyhedron.faces.concat(
    augmentee.faces.map(face =>
      face.map(index => index + polyhedron.vertices.length),
    ),
  )
  _.pullAt(newFaces, [faceIndex, polyhedron.faces.length + undersideIndex])

  // remove extraneous vertices
  // TODO manually match up the faces instead of deduplicating (which can cause precision issues)
  return deduplicateVertices(new Polyhedron(newVertices, newFaces))
}

// find the node in the graph with n sides that is at least (or equal) to dist
// away from a face with m sides
function findWithDistance(
  graph,
  n,
  m,
  dist,
  { exact = false, avoid = [] } = {},
) {
  return _.findKey(graph, (face, index) => {
    if (face.length !== n) return false
    let nbrs = [index]
    // iterate through same faced neighbors
    for (let i = 0; i < dist; i++) {
      nbrs = _(nbrs)
        .flatMap(i => graph[i])
        .filter(i => !_.includes(avoid, graph[i].length))
        .value()
    }
    if (_(nbrs).some(nbr => graph[nbr].length === m)) return false
    // if exact, check that this one's neighbors *are* next to another thing
    if (exact) {
      nbrs = _(nbrs)
        .flatMap(i => graph[i])
        .filter(i => !_.includes(avoid, graph[i].length))
        .value()
      return _(nbrs).some(nbr => graph[nbr].length === m)
    }
    return true
  })
}

export function augment(polyhedron, { fIndex, gyrate }) {
  return doAugment(polyhedron, fIndex, 'pyramidsCupolae', gyrate)
}

export function getElongated(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  return doAugment(polyhedron, faceIndex, 'prisms')
}

export function getGyroElongated(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  return doAugment(polyhedron, faceIndex, 'antiprisms')
}

export function getAugmentFace(polyhedron, point) {
  const hitPoint = vec(point)
  const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint)
  return canAugment(polyhedron, hitFaceIndex) ||
    canAugment(polyhedron, hitFaceIndex, { offset: 1 })
    ? hitFaceIndex
    : -1
}

function removeVertices(polyhedron, vIndices) {
  const [facesToKeep, facesToRemove] = _.partition(
    polyhedron.faces,
    face => _.intersection(face, vIndices).length === 0,
  )
  const newFaces = facesToKeep.concat([getBoundary(facesToRemove)])
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

export function diminish(polyhedron, { vIndices }) {
  return removeVertices(polyhedron, vIndices)
}

export function gyrate(polyhedron, { vIndices }) {
  // get adjacent faces
  const facesToTurn = polyhedron.adjacentFaces(...vIndices)
  const boundary = getBoundary(facesToTurn)

  // TODO this won't work with animation, so I have to reimplement eventually

  // rotate the cupola top
  const boundaryVertices = boundary.map(
    vIndex => polyhedron.vertexVectors()[vIndex],
  )
  const normal = getNormal(boundaryVertices).getNormalized()
  const centroid = calculateCentroid(boundaryVertices)
  // const theta = 2 * Math.PI / boundary.length
  const theta = 2 * Math.PI / numSides(boundary)
  const newVertices = polyhedron.vertices.map((vertex, vIndex) => {
    if (_.includes(vIndices, vIndex)) {
      return vec(vertex)
        .sub(centroid)
        .getRotatedAroundAxis(normal, theta)
        .add(centroid)
        .toArray()
    }
    return vertex
  })

  // Rotate all the points on the boundary
  const newFaces = polyhedron.faces.map(face => {
    return face.map((vIndex, i) => {
      const j = boundary.indexOf(vIndex)
      if (
        j !== -1 &&
        (getMod(face, i + 1) === getMod(boundary, j + 1) ||
          getMod(face, i - 1) === getMod(boundary, j - 1))
      ) {
        return getMod(boundary, j + 1)
      }
      return vIndex
    })
  })

  return new Polyhedron(newVertices, newFaces)
}
