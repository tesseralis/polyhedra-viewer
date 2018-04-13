import _ from 'lodash'

import Polyhedron from 'math/Polyhedron'
import { vec, getPlane, getCentroid, getNormal, PRECISION } from 'math/linAlg'
import { mapObject } from 'util.js'
import { numSides, getCyclic as getMod } from 'math/solidUtils'

import { removeExtraneousVertices } from './operationUtils'

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

export function getAugmentGraph(polyhedron) {
  return polyhedron.fIndices().map(fIndex => canAugment(polyhedron, fIndex))
}

export function getAugmentFace(polyhedron, graph, point) {
  const hitPoint = vec(point)
  const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint)
  return graph[hitFaceIndex] ? hitFaceIndex : -1
}

const sharesVertex = (face1, face2) => {
  const intersectionCount = _.intersection(face1, face2).length
  // Make sure they're not the same face
  return intersectionCount > 0 && intersectionCount < face1.length
}

// Computes the set equality of two arrays
const setEquals = (array1, array2) => _.xor(array1, array2).length === 0

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

// Flatten a polyhedron to the face given at fIndex
function flatten(polyhedron, fIndex) {
  const vertexVectors = polyhedron.vertexVectors()
  const faceVectors = _.at(vertexVectors, polyhedron.faces[fIndex])
  const plane = getPlane(faceVectors)
  const newVertices = vertexVectors.map(v =>
    plane.getProjectedPoint(v).toArray(),
  )
  return polyhedron.withVertices(newVertices)
}

// Augment the following
function doAugment(polyhedron, faceIndex, using, gyrate, mock = false) {
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
  // FIXME rename
  const _augmentee = augmentData[augmentType][index]
  const undersideIndex = _.findIndex(
    _augmentee.faces,
    face => face.length === n,
  )
  const augmentee = mock ? flatten(_augmentee, undersideIndex) : _augmentee

  // rotate and translate so that the face is next to our face
  const augmenteeVertices = augmentee.vertices.map(vec)

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

export function elongate(polyhedron, options, mock) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  const using = `P${numSides(polyhedron.faces[faceIndex])}`
  return doAugment(polyhedron, faceIndex, using, null, mock)
}

// FIXME this needs rotation
export function gyroelongate(polyhedron, options, mock) {
  const faceIndex = _.findIndex(
    polyhedron.faces,
    face => face === _.maxBy(polyhedron.faces, 'length'),
  )
  const using = `A${numSides(polyhedron.faces[faceIndex])}`
  return doAugment(polyhedron, faceIndex, using, null, mock)
}
export function augment(polyhedron, { fIndex, gyrate, using } = {}, mock) {
  return doAugment(polyhedron, fIndex, using, gyrate, mock)
}
