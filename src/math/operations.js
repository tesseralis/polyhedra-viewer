import _ from 'lodash'
import Polyhedron from './Polyhedron'
import { vec, getCentroid, getNormal, PRECISION } from './linAlg'
import { mapObject, replace } from 'util.js'
import { getDirectedEdges, numSides, getCyclic as getMod } from './solidUtils'
import Peak from './Peak'

const TAU = 2 * Math.PI

function nextVertex(face, vIndex) {
  return getMod(face, face.indexOf(vIndex) + 1)
}
function prevVertex(face, vIndex) {
  return getMod(face, face.indexOf(vIndex) - 1)
}

function directedAdjacentFaceIndices(polyhedron, vIndex) {
  const { faces } = polyhedron
  const touchingFaceIndices = _.clone(polyhedron.adjacentFaceIndices(vIndex))
  const result = []
  let next = touchingFaceIndices[0]
  do {
    result.push(next)
    next = _.find(
      touchingFaceIndices,
      f => prevVertex(faces[next], vIndex) === nextVertex(faces[f], vIndex),
    )
  } while (result.length < touchingFaceIndices.length)
  return result
}

function truncateVertex(
  newPolyhedron,
  polyhedron,
  vIndex,
  { mock, rectify } = {},
) {
  // const touchingFaces = polyhedron.adjacentFaces(vIndex)
  const touchingFaceIndices = directedAdjacentFaceIndices(polyhedron, vIndex)
  const touchingFaces = _.at(polyhedron.faces, touchingFaceIndices)
  // const touchingFaceIndices = polyhedron.adjacentFaceIndices(vIndex)
  let verticesToAdd = touchingFaces.map(face => {
    if (mock) {
      return polyhedron.vertices[vIndex]
    }
    const next = nextVertex(face, vIndex)
    const p1 = vec(polyhedron.vertices[vIndex])
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

  const mod = (a, b) => (a >= 0 ? a % b : a % b + b)

  const newFaces = newPolyhedron.faces
    .map((face, faceIndex) => {
      if (!_.includes(touchingFaceIndices, faceIndex)) return face
      const touchingFaceIndex = touchingFaceIndices.indexOf(faceIndex)
      return replace(
        face,
        face.indexOf(vIndex),
        newPolyhedron.vertices.length +
          mod(touchingFaceIndex + 1, touchingFaces.length),
        newPolyhedron.vertices.length + touchingFaceIndex,
      )
    })
    .concat([_.range(newPolyhedron.vertices.length, newVertices.length)])
  return Polyhedron.of(newVertices, newFaces)
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
  console.log('verticesByPoint: ', verticesByPoint)

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
  // remove vertices in faces and extraneous faces
  newFaces = newFaces.map(_.uniq).filter(face => numSides(face) >= 3)

  // remove extraneous vertices
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

/**
 * Remove vertices in the polyhedron that aren't connected to any faces,
 * and remap the faces to the smaller indices
 */
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
  return Polyhedron.of(newVertices, newFaces)
}

export function truncate(polyhedron, options) {
  let newPolyhedron = polyhedron
  _.forEach(polyhedron.vertices, (vertex, index) => {
    newPolyhedron = truncateVertex(newPolyhedron, polyhedron, index, options)
  })
  return deduplicateVertices(newPolyhedron)
}

export function rectify(polyhedron) {
  return truncate(polyhedron, { rectify: true })
}

const augmentees = {
  pyramid: {
    3: 'tetrahedron',
    4: 'square-pyramid',
    5: 'pentagonal-pyramid',
  },

  cupola: {
    2: 'triangular-prism',
    3: 'triangular-cupola',
    4: 'square-cupola',
    5: 'pentagonal-cupola',
  },

  rotunda: {
    5: 'pentagonal-rotunda',
  },

  prism: {
    3: 'triangular-prism',
    4: 'cube',
    5: 'pentagonal-prism',
    6: 'hexagonal-prism',
    8: 'octagonal-prism',
    10: 'decagonal-prism',
  },

  antiprism: {
    3: 'octahedron',
    4: 'square-antiprism',
    5: 'pentagonal-antiprism',
    6: 'hexagonal-antiprism',
    8: 'octagonal-antiprism',
    10: 'decagonal-antiprism',
  },
}

const augmentData = _.mapValues(augmentees, type =>
  _.mapValues(type, Polyhedron.get),
)

const augmentTypes = {
  Y: 'pyramid',
  U: 'cupola',
  R: 'rotunda',
  P: 'prism',
  A: 'antiprism',
}

function getPossibleAugmentees(n) {
  const { pyramid, cupola, rotunda } = augmentData
  return _.compact([pyramid[n], cupola[n / 2], rotunda[n / 2]])
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugmentWith(polyhedron, faceIndex, augmentee, offset) {
  const base = polyhedron.faces[faceIndex]
  const n = base.length
  const undersideIndex = _.findIndex(augmentee.faces, face => face.length === n)
  const undersideFace = augmentee.faces[undersideIndex]

  return _.every(base, (baseV1, i) => {
    const baseV2 = getMod(base, i + 1)
    const baseAngle = polyhedron.getDihedralAngle([baseV1, baseV2])

    const undersideV1 = getMod(undersideFace, i + offset)
    const undersideV2 = getMod(undersideFace, i - 1 + offset)
    const augmenteeAngle = augmentee.getDihedralAngle([
      undersideV1,
      undersideV2,
    ])

    return baseAngle + augmenteeAngle < Math.PI - PRECISION
  })
}

export function canAugment(polyhedron, faceIndex) {
  const base = polyhedron.faces[faceIndex]
  const n = base.length
  const augmentees = getPossibleAugmentees(n)
  for (let augmentee of augmentees) {
    for (let offset of [0, 1]) {
      if (canAugmentWith(polyhedron, faceIndex, augmentee, offset)) {
        return true
      }
    }
  }
  return false
}

const sharesVertex = (face1, face2) => {
  const intersectionCount = _.intersection(face1, face2).length
  // Make sure they're not the same face
  return intersectionCount > 0 && intersectionCount < face1.length
}

// Computes the set equality of two arrays
const setEquals = (array1, array2) => _.xor(array1, array2).length === 0

// Get what kind of base we are augmenting to
function getBaseType(faces, base) {
  const adjacentFaces = faces.filter(face => sharesVertex(face, base))
  const adjacentFaceCounts = _(adjacentFaces)
    .map(numSides)
    .uniq()
    .value()
  if (setEquals(adjacentFaceCounts, [3, 4])) {
    return 'cupola'
  } else if (setEquals(adjacentFaceCounts, [4])) {
    return 'prism'
  } else if (setEquals(adjacentFaceCounts, [3])) {
    return _.intersection(adjacentFaces).length > 0 ? 'pyramid' : 'antiprism'
  } else if (setEquals(adjacentFaceCounts, [3, 5])) {
    return 'rotunda'
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
  return _.map(base, vIndex => {
    // Get the neighbor of each vertex that isn't also in the prism
    const nbrs = polyhedron.adjacentVertexIndices(vIndex)
    return _.find(nbrs, vIndex2 => !_.includes(base, vIndex2))
  })
}

function isCupolaRotunda(baseType, augmentType) {
  return _.xor(['cupola', 'rotunda'], [baseType, augmentType]).length === 0
}

function faceDistanceBetweenVertices(
  polyhedron,
  vIndices1,
  vIndices2,
  exclude = [],
) {
  const v2fGraph = polyhedron.vertexToFaceGraph()
  let foundVertexIndices = vIndices1
  let distance = 0
  while (_.intersection(foundVertexIndices, vIndices2).length === 0) {
    foundVertexIndices = _(foundVertexIndices)
      .flatMap(vIndex => v2fGraph[vIndex])
      .map(fIndex => polyhedron.faces[fIndex])
      .filter(face => !_.includes(exclude, numSides(face)))
      .flatten()
      .uniq()
      .value()
    distance++

    if (distance > 10) {
      throw new Error('Reached some unreachable state')
    }
  }
  return distance
}

function getSingle(array) {
  if (array.length !== 1) {
    throw new Error(`Expected array to have one element: ${array}`)
  }
  return array[0]
}

// Return "meta" or "para", or null
export function getAugmentAlignment(polyhedron, fIndex) {
  // get the existing peak boundary
  const peakBoundary = getSingle(polyhedron.peaks()).boundary()
  const isHexagonalPrism = _.some(
    polyhedron.faces,
    face => numSides(face) === 6,
  )

  // calculate the face distance to the peak's boundary
  return faceDistanceBetweenVertices(
    polyhedron,
    polyhedron.faces[fIndex],
    peakBoundary,
    [isHexagonalPrism && 6],
  ) > 1
    ? 'para'
    : 'meta'
}

export function getPeakAlignment(polyhedron, peak) {
  const peakBoundary = peak.boundary()

  const isRhombicosidodecahedron = peak.type === 'cupola'

  const orthoIndices = isRhombicosidodecahedron
    ? _.filter(
        polyhedron.peaks(),
        peak => getCupolaGyrate(polyhedron, peak) === 'ortho',
      )
    : []
  const diminishedIndices =
    orthoIndices.length > 0
      ? getSingle(orthoIndices).boundary()
      : _.maxBy(polyhedron.faces, numSides)

  return faceDistanceBetweenVertices(
    polyhedron,
    diminishedIndices,
    peakBoundary,
  ) >= (isRhombicosidodecahedron ? 2 : 1)
    ? 'para'
    : 'meta'
}

export function getCupolaGyrate(polyhedron, peak) {
  const boundary = peak.boundary()
  const isOrtho = _.every(getDirectedEdges(boundary), edge => {
    const [n1, n2] = polyhedron.faces
      .filter(face => _.intersection(face, edge).length === 2)
      .map(numSides)
    return (n1 === 4) === (n2 === 4)
  })
  return isOrtho ? 'ortho' : 'gyro'
}

export function getGyrateDirection(polyhedron, peak) {
  return getCupolaGyrate(polyhedron, peak) === 'ortho' ? 'back' : 'forward'
}

// Return true if the base and augmentee are aligned
function isAligned(
  polyhedron,
  base,
  augmentee,
  underside,
  gyrate,
  augmentType,
) {
  if (_.includes(['pyramid', 'prism', 'antiprism'], augmentType)) return true
  const baseType = getBaseType(polyhedron.faces, base)
  if (baseType === 'pyramid' || baseType === 'antiprism') {
    return true
  }

  if (baseType === 'prism' && polyhedron.peaks().length === 0) {
    return true
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
    underside[0],
    _.last(underside),
  ])

  if (baseType === 'rhombicosidodecahedron') {
    const isOrtho = (numSides(adjFace) !== 4) === (numSides(alignedFace) !== 4)
    return isOrtho === (gyrate === 'ortho')
  }

  // It's orthogonal if triangle faces are aligned or non-triangle faces are aligned
  const isOrtho = (numSides(adjFace) !== 3) === (numSides(alignedFace) !== 3)

  if (baseType === 'truncated') {
    return !isOrtho
  }

  // "ortho" or "gyro" is actually determined by whether the *tops* are aligned, not the bottoms
  // So for a cupola-rotunda, it's actually the opposite of everything else
  if (isCupolaRotunda(polyhedron.peaks()[0].type, augmentType)) {
    return isOrtho !== (gyrate === 'ortho')
  }

  return isOrtho === (gyrate === 'ortho')
}

// Augment the following
function doAugment(polyhedron, faceIndex, using, gyrate) {
  const { faces, vertices } = polyhedron
  const base = faces[faceIndex]
  const n = base.length
  const prefix = using[0]
  const index = using.substring(1)
  const baseVertices = base.map(index => vec(vertices[index]))
  const baseCenter = getCentroid(baseVertices)
  const sideLength = baseVertices[0].distanceTo(baseVertices[1])
  const baseNormal = getNormal(baseVertices)

  const augmentType = augmentTypes[prefix]
  const augmentee = augmentData[augmentType][index]
  const augmenteeVertices = augmentee.vertices.map(vec)
  // rotate and translate so that the face is next to our face
  const undersideIndex = _.findIndex(augmentee.faces, face => face.length === n)
  const undersideFace = augmentee.faces[undersideIndex]
  const undersideVertices = undersideFace.map(index => augmenteeVertices[index])
  const undersideNormal = getNormal(undersideVertices)
  const undersideCenter = getCentroid(undersideVertices)
  const augmenteeSideLength = undersideVertices[0].distanceTo(
    undersideVertices[1],
  )

  const alignBasesNormal = (() => {
    const cross = undersideNormal.cross(baseNormal).getNormalized()
    // If they're the same (e.g. augmenting something with itself), use a random vertex on the base
    if (cross.magnitude() < PRECISION) {
      return baseVertices[0].sub(baseCenter).getNormalized()
    }
    return cross
  })()
  // The `|| 0` is because this sometimes returns NaN if the angle is 0
  const alignBasesAngle = baseNormal.angleBetween(undersideNormal, true) || 0

  const alignedAugmenteeVertices = augmenteeVertices.map(v => {
    return v
      .sub(undersideCenter)
      .scale(sideLength / augmenteeSideLength)
      .getRotatedAroundAxis(alignBasesNormal, alignBasesAngle - Math.PI)
  })

  const translatedV0 = baseVertices[0].sub(baseCenter)
  const baseIsAligned = isAligned(
    polyhedron,
    base,
    augmentee,
    undersideFace,
    gyrate,
    augmentType,
  )
  const offset = baseIsAligned ? 0 : 1
  const alignedV0 = alignedAugmenteeVertices[undersideFace[offset]]
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

  // Map the underside vertices to the base's
  const undersideMapping = mapObject(base, (vIndex, i) => {
    const correspondingIndex = getMod(undersideFace, offset - i)
    return [correspondingIndex, vIndex]
  })

  const newFaces = polyhedron.faces.concat(
    augmentee.faces.map(face =>
      face.map(vIndex =>
        _.get(undersideMapping, vIndex, vIndex + polyhedron.numVertices()),
      ),
    ),
  )
  // Remove the original base and underside
  _.pullAt(newFaces, [faceIndex, polyhedron.numFaces() + undersideIndex])

  // remove extraneous vertices
  return removeExtraneousVertices(Polyhedron.of(newVertices, newFaces))
}

export function getAugmentFace(polyhedron, point) {
  const hitPoint = vec(point)
  const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint)
  return canAugment(polyhedron, hitFaceIndex) ? hitFaceIndex : -1
}

function removeVertices(polyhedron, peak) {
  const newFaces = polyhedron.faces.concat([peak.boundary()])
  _.pullAt(newFaces, peak.faceIndices())
  return removeExtraneousVertices(polyhedron.withFaces(newFaces))
}

export function elongate(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  const using = `P${numSides(polyhedron.faces[faceIndex])}`
  return doAugment(polyhedron, faceIndex, using)
}

export function gyroelongate(polyhedron) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  const using = `A${numSides(polyhedron.faces[faceIndex])}`
  return doAugment(polyhedron, faceIndex, using)
}

export function shorten(polyhedron) {
  // Find a prism or antiprism face
  const face = _(polyhedron.faces)
    .filter((face, fIndex) => {
      const adjacentFace = polyhedron.faceGraph()[fIndex]
      const adjacent = adjacentFace.map(fIndex2 => polyhedron.faces[fIndex2])
      return _.keys(_.countBy(adjacent, numSides)).length === 1
    })
    .maxBy(numSides)
  return removeVertices(polyhedron, new Peak(polyhedron, face))
}

export function augment(polyhedron, fIndex, { gyrate, using } = {}) {
  return doAugment(polyhedron, fIndex, using, gyrate)
}

export function diminish(polyhedron, peak) {
  return removeVertices(polyhedron, peak)
}

export function gyrate(polyhedron, peak) {
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
