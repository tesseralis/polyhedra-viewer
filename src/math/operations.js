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
    // TODO there should be a way to do this manually so that we don't get any precision issues
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

function getEdgesOrdered(face) {
  return _.map(face, (vertex, index) => {
    return [vertex, face[(index + 1) % face.length]]
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
// TODO digonal cupola option and rotunda option; also reappropriate for elongation
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
  // TODO maybe move "withEdges" to the rendering component?
  return withEdges(augment(polyhedron, faceIndex, 'prisms'))
}

export function getGyroElongated(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  return withEdges(augment(polyhedron, faceIndex, 'antiprisms'))
}

export function getAugmented(polyhedron, name) {
  // only do the "main" class right now
  // Determine whether we're a (augmented) prism or an archimedean solid or dodecahedron
  // use the graph and the para/meta option to determine which face we should augment to
  // (do meta for now)
  const faceIndex = getFaceToAugment(polyhedron, name)
  // (special case: triangular prism)
  // do the augmentation
  return withEdges(augment(polyhedron, faceIndex, 'pyramidsCupolae'))
}

// Find a pyramid and return the vertex index
function findPyramid(polyhedron, n) {
  return _.findIndex(polyhedron.vertices, (vertex, vIndex) => {
    const adjacentFaces = _.filter(polyhedron.faces, face =>
      _.includes(face, vIndex),
    )
    if (n >= 3 && adjacentFaces.length !== n) return false
    return _.every(adjacentFaces, { length: 3 })
  })
}

// get an array mapping each vertex index to the indices of the faces it is adjacent to
function getAdjacentFacesMapping(polyhedron) {
  const mapping = polyhedron.vertices.map(() => [])
  polyhedron.faces.forEach((face, fIndex) => {
    face.forEach(vIndex => {
      mapping[vIndex].push(fIndex)
    })
  })
  return mapping
}

// Find a cupola and return the vertices of its top
function findCupola(polyhedron) {
  // find the face in the polyhedron whose vertices' adjacent faces are <face>-4-3-4
  const adjacentFacesMapping = getAdjacentFacesMapping(polyhedron)
  return _.find(polyhedron.faces, (face, fIndex) => {
    const count = {
      [face.length]: 1,
      4: 2,
      3: 1,
    }
    // FIXME this doesn't work (e.g. pseudo-rhombicuboctahedron)
    // Compare the square faces and make sure they're not touching
    return _.every(face, vIndex => {
      const foo = _(adjacentFacesMapping[vIndex])
        .map(fIndex2 => polyhedron.faces[fIndex2].length)
        .groupBy()
        .mapValues('length')
        .value()
      return _.isEqual(foo, count)
    })
  })
}

function getVerticesToDiminish(polyhedron, name) {
  if (name.includes('truncated')) {
    return findCupola(polyhedron)
  } else if (name.includes('sphenocorona') || name.includes('prism')) {
    return [findPyramid(polyhedron, 4)]
  } else {
    return [findPyramid(polyhedron)]
  }
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

export function getDiminished(polyhedron, name) {
  const vIndices = getVerticesToDiminish(polyhedron, name)
  return withEdges(removeVertices(polyhedron, vIndices))
}
