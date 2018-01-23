import * as _ from 'lodash'
import { geom } from 'toxiclibsjs'
import { getSolidData } from 'constants/polyhedra'
const PRECISION = 1e-3

const { Vec3D, Triangle3D, Plane } = geom

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

// convert an array of vertices into a vector
const vec = p => new Vec3D(...p)

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

function getPlane(face, vertices) {
  const triang = _.take(face, 3).map(vIndex => vec(vertices[vIndex]))
  return new Plane(new Triangle3D(...triang))
}

function isPlanar(face, vertices) {
  const vecs = face.map(vIndex => vec(vertices[vIndex]))
  const triang = _.take(vecs, 3)
  const plane = new Plane(new Triangle3D(...triang))
  return _.every(vecs, vec => plane.getDistanceToPoint(vec) < PRECISION)
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
  return { faces: newFaces, vertices: newVertices }
}

function removeExtraneousVertices({ vertices, faces }) {
  const toRemove = _.difference(_.range(vertices.length), _.flatMap(faces))

  const mapping = _(_.range(vertices.length))
    .takeRight(toRemove.length)
    .difference(toRemove)
    .map((value, index) => [value, toRemove[index]])
    .fromPairs()
    .value()

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
    toRemove.length,
  )
  return { faces: newFaces, vertices: newVertices }
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
  return removeExtraneousVertices({
    faces: newFaces,
    vertices: polyhedron.vertices,
  })
}

export function getEdges(face) {
  return _.map(face, (vertex, index) => {
    return _.sortBy([vertex, face[(index + 1) % face.length]])
  })
}

function getEdgesOrdered(face) {
  return _.map(face, (vertex, index) => {
    return [vertex, getMod(face, index + 1)]
  })
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
    _.forEach(getEdges(face), edge => {
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
  _.mapValues(type, name => getSolidData(name)),
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
  const baseType = getBaseType(polyhedron.faces, base)
  if (baseType === 'antiprism') {
    return 0
  }

  if (baseType === 'prism' && getCupolae(polyhedron).length === 0) {
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
  return deduplicateVertices({ vertices: newVertices, faces: newFaces })
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

// get an array mapping each vertex index to the indices of the faces it is adjacent to
export function getAdjacentFacesMapping(polyhedron) {
  const mapping = polyhedron.vertices.map(() => [])
  polyhedron.faces.forEach((face, fIndex) => {
    face.forEach(vIndex => {
      mapping[vIndex].push(fIndex)
    })
  })
  return mapping
}

// Get a face representing the boundary of the faces
function getBoundary(faces) {
  // TODO deduplicate
  const edges = {}
  // build up a lookup table for every pair of edges to that face
  _.forEach(faces, (face, index) => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    _.forEach(getEdgesOrdered(face), edge => {
      const [i1, i2] = edge
      if (_.includes(edges[i2], i1)) {
        _.pull(edges[i2], i1)
      } else {
        if (!edges[i1]) {
          edges[i1] = []
        }
        edges[i1].push(i2)
      }
    })
  })

  const cycle = _(edges)
    .pickBy('length')
    .mapValues(0)
    .value()
  const first = _.values(cycle)[0]
  const result = [first]
  for (let i = cycle[first]; i !== first; i = cycle[i]) {
    result.push(i)
  }
  return result
}

function isPyramid({ faces, vertices }, vIndex, { adjacentFacesMapping }) {
  const adjacentFaces = adjacentFacesMapping[vIndex].map(
    fIndex => faces[fIndex],
  )
  if (!_.every(adjacentFaces, { length: 3 })) return false
  const boundary = getBoundary(adjacentFaces)
  return isPlanar(boundary, vertices)
}

// Return the face indices of all the faces that are tops of cupolae
function getPyramidIndices(polyhedron, { adjacentFacesMapping } = {}) {
  const { vertices } = polyhedron
  // find the face in the polyhedron whose vertices' adjacent faces are <face>-4-3-4
  if (!adjacentFacesMapping) {
    adjacentFacesMapping = getAdjacentFacesMapping(polyhedron)
  }
  return _.filter(_.range(vertices.length), vIndex =>
    isPyramid(polyhedron, vIndex, { adjacentFacesMapping }),
  )
}

function isCupola({ faces, vertices }, fIndex, { adjacentFacesMapping }) {
  const face = faces[fIndex]
  const cupolaCount = _.countBy([3, 4, 4, face.length])
  const hasRightSides = _.every(face, vIndex => {
    const nbrFaces = adjacentFacesMapping[vIndex].map(fIndex2 => faces[fIndex2])
    const count = _(nbrFaces)
      .map('length')
      .countBy()
      .value()

    if (!_.isEqual(count, cupolaCount)) return false
    // Make sure that the square faces aren't adjacent
    const [sqFace1, sqFace2] = _.filter(
      nbrFaces,
      nbrFace => nbrFace.length === 4 && !_.isEqual(nbrFace, face),
    )
    return _.intersection(sqFace1, sqFace2).length === 1
  })

  if (!hasRightSides) return false

  const allNeighborFaces = _.uniq(
    _.flatMap(face, vIndex => adjacentFacesMapping[vIndex]),
  ).map(fIndex2 => faces[fIndex2])

  // return true
  // make sure the whole thing is on a plane
  const boundary = getBoundary(allNeighborFaces)
  return isPlanar(boundary, vertices)
}

// Return the face indices of all the faces that are tops of cupolae
function getCupolaeIndices(polyhedron, { adjacentFacesMapping } = {}) {
  const { faces } = polyhedron
  // find the face in the polyhedron whose vertices' adjacent faces are <face>-4-3-4
  if (!adjacentFacesMapping) {
    adjacentFacesMapping = getAdjacentFacesMapping(polyhedron)
  }
  return _.filter(_.range(faces.length), fIndex =>
    isCupola(polyhedron, fIndex, { adjacentFacesMapping }),
  )
}

export function getCupolae(polyhedron) {
  return getCupolaeIndices(polyhedron).map(fIndex => polyhedron.faces[fIndex])
}

function getHitFaceIndex({ faces, vertices }, point) {
  return _.minBy(_.range(faces.length), fIndex => {
    const face = faces[fIndex]
    const plane = getPlane(face, vertices)
    return plane.getDistanceToPoint(point)
  })
}

export function getAugmentFace(polyhedron, point) {
  const hitPoint = vec(point)
  const hitFaceIndex = getHitFaceIndex(polyhedron, hitPoint)
  return canAugment(polyhedron, hitFaceIndex) ||
    canAugment(polyhedron, hitFaceIndex, { offset: 1 })
    ? hitFaceIndex
    : -1
}

export function getPyramidOrCupola(
  polyhedron,
  point,
  { pyramids } = {}, // whether to allow pyramids or not
) {
  const { faces, vertices } = polyhedron
  const hitPoint = vec(point)
  const hitFaceIndex = getHitFaceIndex(polyhedron, hitPoint)
  const adjacentFacesMapping = getAdjacentFacesMapping({
    faces,
    vertices,
  })
  const pyramidIndices = pyramids
    ? getPyramidIndices(polyhedron, { adjacentFacesMapping })
    : []

  // A solid can have only pyramids or cupolae/rotundae, so it suffices to check for one
  if (pyramidIndices.length > 0) {
    // check if we're inside any pyramid
    const pyramidFaces = _.flatMap(
      pyramidIndices,
      vIndex => adjacentFacesMapping[vIndex],
    )
    if (!_.includes(pyramidFaces, hitFaceIndex)) {
      return null
    }

    const nearestPeak = _.minBy(pyramidIndices, vIndex => {
      const vertex = vec(vertices[vIndex])
      return vertex.distanceTo(hitPoint)
    })
    return [nearestPeak]
  }

  // Other
  const cupolaeIndices = getCupolaeIndices(polyhedron, { adjacentFacesMapping })

  // check if we're inside any cupola
  const cupolaeFaces = _.flatMapDeep(cupolaeIndices, fIndex =>
    _.map(faces[fIndex], vIndex => adjacentFacesMapping[vIndex]),
  )
  if (!_.includes(cupolaeFaces, hitFaceIndex)) {
    return null
  }

  // if so, determine the closest cupola point to this
  const nearestPeak = _.minBy(cupolaeIndices, fIndex => {
    const plane = getPlane(faces[fIndex], vertices)
    return plane.getDistanceToPoint(hitPoint)
  })

  return faces[nearestPeak]
}

function removeVertices(polyhedron, vIndices) {
  const [newFaces, facesToRemove] = _.partition(
    polyhedron.faces,
    face => _.intersection(face, vIndices).length === 0,
  )
  return removeExtraneousVertices({
    ...polyhedron,
    faces: newFaces.concat([getBoundary(facesToRemove)]),
  })
}

export function diminish(polyhedron, { vIndices }) {
  return removeVertices(polyhedron, vIndices)
}

// TODO allow gyrating rotundae
export function gyrate(polyhedron, { vIndices }) {
  // get adjacent faces
  const facesToTurn = _.filter(
    polyhedron.faces,
    face => _.intersection(face, vIndices).length !== 0,
  )
  const boundary = getBoundary(facesToTurn)

  // TODO this won't work with animation, so I have to reimplement eventually

  // rotate the cupola top
  const boundaryVertices = boundary.map(vIndex =>
    vec(polyhedron.vertices[vIndex]),
  )
  const normal = getNormal(boundaryVertices).getNormalized()
  const centroid = calculateCentroid(boundaryVertices)
  const theta = Math.PI / vIndices.length
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

  return { faces: newFaces, vertices: newVertices }
}
