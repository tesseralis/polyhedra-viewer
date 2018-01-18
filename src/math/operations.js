import * as _ from 'lodash'
import { geom } from 'toxiclibsjs'
import { getSolidData } from 'constants/polyhedra'
const PRECISION = 1e-3

const { Vec3D, Triangle3D, Plane } = geom

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

function getPlane(face, vertices) {
  const triang = _.take(face, 3).map(vIndex => new Vec3D(...vertices[vIndex]))
  return new Plane(new Triangle3D(...triang))
}

function isPlanar(face, vertices) {
  const vecs = face.map(vIndex => new Vec3D(...vertices[vIndex]))
  const triang = _.take(vecs, 3)
  const plane = new Plane(new Triangle3D(...triang))
  return _.every(vecs, vec => plane.getDistanceToPoint(vec) < PRECISION)
}

function nextVertex(face, vertex) {
  return getMod(face, face.indxOf(vertex) + 1)
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

// Augment the following
// TODO digonal cupola option and rotunda option
function augment(polyhedron, faceIndex, type) {
  const base = polyhedron.faces[faceIndex]
  const n = base.length
  const baseVertices = toVec3D(base.map(index => polyhedron.vertices[index]))
  const baseCenter = calculateCentroid(baseVertices)
  const sideLength = baseVertices[0].distanceTo(baseVertices[1])
  const baseNormal = getNormal(baseVertices)

  const augmentee = getSolidData(augmentTypes[type][n])
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

  const translatedV0 = baseVertices[0].sub(baseCenter)
  const alignIndex = (() => {
    if (base.length <= 5) return 0
    // If we're dealing with a cupola (that is, augmenting an archimedean solid)
    // make sure that the triangular faces don't line up
    const adjFace = _.find(
      polyhedron.faces,
      face => _.intersection([base[0], base[1]], face).length === 2,
    )
    const alignedFace = _.find(
      augmentee.faces,
      face =>
        _.intersection([undersideFace[0], _.last(undersideFace)], face)
          .length === 2,
    )
    return (adjFace.length !== 3) !== (alignedFace.length !== 3) ? 0 : 1
  })()
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

function getFaceToAugment(polyhedron, name) {
  // only do the "main" class right now
  const graph = faceGraph(polyhedron)
  const maxFace = _(polyhedron.faces)
    .map('length')
    .max()
  // TODO rely on a database of metadata instead of just parsing the name
  // Determine whether we're a (augmented) prism or an archimedean solid or dodecahedron
  if (name.includes('sphenocorona')) {
    return findWithDistance(graph, 4, 3, 0)
  }
  if (name.includes('truncated')) {
    return findWithDistance(graph, maxFace, 4, name.includes('para') ? 3 : 2, {
      exact: name.includes('meta'),
    })
  } else if (name.includes('dodecahedron')) {
    return findWithDistance(graph, maxFace, 3, name.includes('para') ? 2 : 1, {
      exact: name.includes('meta'),
    })
  } else if (name.includes('prism')) {
    return findWithDistance(
      graph,
      4,
      3,
      name.includes('triangular') ? 0 : name.includes('para') ? 2 : 1,
      {
        exact: name.includes('meta'),
        avoid: [maxFace],
      },
    )
  }
}

export function getElongated(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  return augment(polyhedron, faceIndex, 'prisms')
}

export function getGyroElongated(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  return augment(polyhedron, faceIndex, 'antiprisms')
}

export function getAugmented(polyhedron, name) {
  // only do the "main" class right now
  // Determine whether we're a (augmented) prism or an archimedean solid or dodecahedron
  // use the graph and the para/meta option to determine which face we should augment to
  // (do meta for now)
  const faceIndex = getFaceToAugment(polyhedron, name)
  // (special case: triangular prism)
  // do the augmentation
  return augment(polyhedron, faceIndex, 'pyramidsCupolae')
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
    // ...this is n^2? more? ah who cares I'm too lazy
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

export function getPyramidOrCupola({ faces, vertices }, point) {
  // TODO deduplicate
  const hitPoint = new Vec3D(...point)
  const hitFaceIndex = _.minBy(_.range(faces.length), fIndex => {
    const face = faces[fIndex]
    const plane = getPlane(face, vertices)
    return plane.getDistanceToPoint(hitPoint)
  })
  const adjacentFacesMapping = getAdjacentFacesMapping({
    faces,
    vertices,
  })
  const pyramidIndices = getPyramidIndices(
    { faces, vertices },
    { adjacentFacesMapping },
  )

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
      const vertex = new Vec3D(...vertices[vIndex])
      return vertex.distanceTo(hitPoint)
    })
    return [nearestPeak]
  }

  // Other
  const cupolaeIndices = getCupolaeIndices(
    { faces, vertices },
    { adjacentFacesMapping },
  )

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

/**
 * Return the face index of the cupola in the polyhedron that contains the point.
 * Return -1 if the point is not part of any cupola.
 * If the point is part of more than one cupola, this will return the one whose top
 * the given point is closest to.
 */
export function getCupolaTop({ faces, vertices }, point) {
  const hitPoint = new Vec3D(...point)
  const hitFaceIndex = _.minBy(_.range(faces.length), fIndex => {
    const face = faces[fIndex]
    const plane = getPlane(face, vertices)
    return plane.getDistanceToPoint(hitPoint)
  })
  const adjacentFacesMapping = getAdjacentFacesMapping({
    faces,
    vertices,
  })
  const cupolaeIndices = getCupolaeIndices(
    { faces, vertices },
    { adjacentFacesMapping },
  )

  // check if we're inside any cupola
  const cupolaeFaces = _.flatMapDeep(cupolaeIndices, fIndex =>
    _.map(faces[fIndex], vIndex => adjacentFacesMapping[vIndex]),
  )
  if (!_.includes(cupolaeFaces, hitFaceIndex)) {
    return -1
  }

  // if so, determine the closest cupola point to this
  const nearestPeak = _.minBy(cupolaeIndices, fIndex => {
    const plane = getPlane(faces[fIndex], vertices)
    return plane.getDistanceToPoint(hitPoint)
  })

  return nearestPeak
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
export function gyrate(polyhedron, { fIndex }) {
  // get adjacent faces
  const vIndices = polyhedron.faces[fIndex]
  const facesToTurn = _.filter(
    polyhedron.faces,
    face => _.intersection(face, vIndices).length !== 0,
  )
  const boundary = getBoundary(facesToTurn)

  // TODO this won't work with animation, so I have to reimplement eventually

  // rotate the cupola top
  const boundaryVertices = toVec3D(
    boundary.map(vIndex => polyhedron.vertices[vIndex]),
  )
  const normal = getNormal(boundaryVertices).getNormalized()
  const centroid = calculateCentroid(boundaryVertices)
  const theta = Math.PI / vIndices.length
  const newVertices = polyhedron.vertices.map((vertex, vIndex) => {
    if (_.includes(vIndices, vIndex)) {
      return new Vec3D(...vertex)
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
