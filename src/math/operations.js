import _ from 'lodash'
import Polyhedron, {
  numSides,
  getBoundary,
  getDirectedEdges,
} from './Polyhedron'
import { vec, getCentroid, getNormal, PRECISION } from './linAlg'
import { replace } from 'util.js'

const TAU = 2 * Math.PI

function mod(a, b) {
  return a >= 0 ? a % b : a % b + b
}

// TODO deduplicate with getCyclic
// get the element in the array mod the array's length
function getMod(array, index) {
  return array[mod(index, array.length)]
}

function nextVertex(face, vertex) {
  return getMod(face, face.indexOf(vertex) + 1)
}

function truncateVertex(newPolyhedron, polyhedron, vertex, { mock, rectify }) {
  const touchingFaces = polyhedron.adjacentFaces(vertex)
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
  return Polyhedron.of(newVertices, newFaces)
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

export function truncate(polyhedron, options = {}) {
  let newPolyhedron = polyhedron
  _.forEach(polyhedron.vertices, (vertex, index) => {
    newPolyhedron = truncateVertex(newPolyhedron, polyhedron, index, options)
  })
  // TODO remove duplicate vertices when cantellating
  return removeExtraneousVertices(newPolyhedron)
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

// Default augmentee for each numFaces
const defaultAugmentees = {
  3: 'Y3',
  4: 'Y4',
  5: 'Y5',
  6: 'U3',
  8: 'U4',
  10: 'U5',
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

function getDefaultAugmentee(n) {
  const [prefix, index] = defaultAugmentees[n]
  return augmentData[augmentTypes[prefix]][index]
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
// TODO add ortho/gyro to the "canAugment" argument
export function canAugment(polyhedron, faceIndex, { offset = 0 } = {}) {
  const base = polyhedron.faces[faceIndex]
  const n = base.length

  // This *should* work on everything except gyrobifastigium
  const augmentee = getDefaultAugmentee(n)
  const undersideIndex = _.findIndex(augmentee.faces, face => face.length === n)
  const undersideFace = augmentee.faces[undersideIndex]

  return _.every(base, (baseV1, i) => {
    const baseV2 = getMod(base, i + 1)
    const baseAngle = polyhedron.getDihedralAngle([baseV1, baseV2])

    // todo doesn't work on cupolae
    const undersideV1 = getMod(undersideFace, i + offset)
    const undersideV2 = getMod(undersideFace, i - 1 + offset)
    const augmenteeAngle = augmentee.getDihedralAngle([
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

// Computes the set equality of two arrays
const setEquals = (array1, array2) => _.xor(array1, array2).length === 0

// Get what kind of base we are augmenting to
// TODO should I just use the "using" property to figure this out?
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

function isCupolaRotunda(polyhedron, augmentType) {
  const baseType = polyhedron.cupolaIndices().length > 0 ? 'cupola' : 'rotunda'
  return _.xor(['cupola', 'rotunda'], [baseType, augmentType]).length === 0
}

function faceGraphDistance(polyhedron, fIndices, peakBoundary, exclude = []) {
  const faceGraph = polyhedron.faceGraph()
  const excludeFn = fIndex =>
    !_.includes(exclude, numSides(polyhedron.faces[fIndex]))
  let foundFaceIndices = _.flatMap(peakBoundary, vIndex =>
    polyhedron.adjacentFaceIndices(vIndex),
  ).filter(excludeFn)
  let distance = 0
  while (
    _.intersection(foundFaceIndices, fIndices).length === 0 &&
    distance < 5
  ) {
    foundFaceIndices = _.uniq(
      _.flatMap(foundFaceIndices, fIndex => faceGraph[fIndex]).filter(
        excludeFn,
      ),
    )
    distance++
  }
  return distance
}

function faceDistanceBetweenVertices(polyhedron, vIndices1, vIndices2) {
  const faceGraph = polyhedron.faceGraph()
  let foundFaceIndices = _.flatMap(vIndices1, vIndex =>
    polyhedron.adjacentFaceIndices(vIndex),
  )
  let distance = 0
  while (
    _.intersection(
      _.flatMap(foundFaceIndices, fIndex => polyhedron.faces[fIndex]),
      vIndices2,
    ).length === 0 &&
    distance < 5
  ) {
    foundFaceIndices = _.uniq(
      _.flatMap(foundFaceIndices, fIndex => faceGraph[fIndex]),
    )
    distance++
  }
  return distance
}

// Return "meta" or "para", or null
export function getAugmentAlignment(polyhedron, fIndex) {
  // get the existing peak boundary
  const peakBoundary = polyhedron.getPeakBoundary()
  const isHexagonalPrism = _.some(
    polyhedron.faces,
    face => numSides(face) === 6,
  )

  // calculate the face distance to the peak's boundary
  return faceGraphDistance(polyhedron, [fIndex], peakBoundary, [
    isHexagonalPrism && 6,
  ]) > 1
    ? 'para'
    : 'meta'
}

// FIXME diminished rhombicosidodecahedra
export function getDiminishAlignment(polyhedron, vIndices) {
  const { faces } = polyhedron
  const peakBoundary = getBoundary(polyhedron.adjacentFaces(...vIndices))

  const maxNumSides = _.max(faces.map(numSides))
  const rhombicos = vIndices.length > 1
  const diminishedIndices = polyhedron
    .fIndices()
    .filter(
      fIndex =>
        numSides(faces[fIndex]) === maxNumSides &&
        (rhombicos && polyhedron.isCupola(fIndex)
          ? getDiminishGyrate(polyhedron, faces[fIndex]) === 'ortho'
          : true),
    )

  // FIXME make this more stable
  return faceGraphDistance(polyhedron, diminishedIndices, peakBoundary) >=
    (rhombicos ? 2 : 1)
    ? 'para'
    : 'meta'
}

export function getGyrateDirection(polyhedron, vIndices) {
  const boundary = getBoundary(polyhedron.adjacentFaces(...vIndices))
  const isOrtho = _.every(getDirectedEdges(boundary), edge => {
    const [n1, n2] = polyhedron.faces
      .filter(face => _.intersection(face, edge).length === 2)
      .map(numSides)
    return (n1 === 4) === (n2 === 4)
  })
  return isOrtho ? 'back' : 'forward'
}

export function getDiminishGyrate(polyhedron, vIndices) {
  // FIXME these dependencies should be reversed
  return getGyrateDirection(polyhedron, vIndices) === 'back' ? 'ortho' : 'gyro'
}

export function getGyrateAlignment(polyhedron, vIndices) {
  const { faces } = polyhedron
  const boundary = getBoundary(polyhedron.adjacentFaces(...vIndices))
  const vIndicesToCheck = (() => {
    const cupolaBoundaries = polyhedron
      .cupolaIndices()
      .map(fIndex => faces[fIndex])
      .filter(vIndices => getGyrateDirection(polyhedron, vIndices) === 'back')
      .map(vIndices => getBoundary(polyhedron.adjacentFaces(...vIndices)))

    if (cupolaBoundaries.length > 0) {
      if (cupolaBoundaries.length !== 1) {
        throw new Error('we done goofed too')
      }
      return cupolaBoundaries[0]
    }

    const maxNumSides = _.max(faces.map(numSides))
    const diminishedIndices = polyhedron
      .fIndices()
      .filter(fIndex => numSides(faces[fIndex]) === maxNumSides)

    if (diminishedIndices.length !== 1) {
      throw new Error('we done did something wrong')
    }
    return faces[diminishedIndices[0]]
  })()
  return faceDistanceBetweenVertices(polyhedron, boundary, vIndicesToCheck) > 1
    ? 'para'
    : 'meta'
}

function isFastigium(augmentType, underside) {
  return augmentType === 'cupola' && numSides(underside) === 4
}

// TODO handle rhombicosidodecahedron case (still don't know what terminology I want to use)
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
  const fastigium = isFastigium(augmentType, underside)
  if (baseType === 'pyramid' || baseType === 'antiprism') {
    return true
  }

  if (baseType === 'prism' && polyhedron.cupolaIndices().length === 0) {
    return true
  }

  if (baseType !== 'truncated' && !fastigium && _.isNil(gyrate)) {
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

  // It's orthogonal if triangle faces are aligned or non-triangle faces are aligned
  const isOrtho = (numSides(adjFace) !== 3) === (numSides(alignedFace) !== 3)

  if (baseType === 'truncated') {
    return !isOrtho
  }

  if (fastigium) {
    return !isOrtho
  }

  // "ortho" or "gyro" is actually determined by whether the *tops* are aligned, not the bottoms
  // So for a cupola-rotunda, it's actually the opposite of everything else
  if (isCupolaRotunda(polyhedron, augmentType)) {
    return isOrtho !== (gyrate === 'ortho')
  }

  return isOrtho === (gyrate === 'ortho')
}

// Augment the following
// TODO digonal cupola option and rotunda option
function doAugment(polyhedron, faceIndex, using, gyrate) {
  const { faces, vertices } = polyhedron
  const base = faces[faceIndex]
  const n = base.length
  const augmenteeCode = using || defaultAugmentees[n]
  const prefix = augmenteeCode[0]
  const index = augmenteeCode.substring(1)
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

  // TODO what if they're perpendicular?
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
  const alignedV0 =
    alignedAugmenteeVertices[undersideFace[baseIsAligned ? 0 : 1]]
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
  return deduplicateVertices(Polyhedron.of(newVertices, newFaces))
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
  return removeVertices(polyhedron, face)
}

export function augment(polyhedron, fIndex, { gyrate, using } = {}) {
  return doAugment(polyhedron, fIndex, using, gyrate)
}

export function diminish(polyhedron, vIndices) {
  return removeVertices(polyhedron, vIndices)
}

export function gyrate(polyhedron, vIndices) {
  // get adjacent faces
  const facesToTurn = polyhedron.adjacentFaces(...vIndices)
  const boundary = getBoundary(facesToTurn)

  // rotate the cupola/rotunda top
  const boundaryVertices = boundary.map(
    vIndex => polyhedron.vertexVectors()[vIndex],
  )
  const normal = getNormal(boundaryVertices).getNormalized()
  const centroid = getCentroid(boundaryVertices)
  const theta = TAU / numSides(boundary)
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
  // TODO this won't work with animation, so I have to reimplement eventually
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

  return Polyhedron.of(newVertices, newFaces)
}
