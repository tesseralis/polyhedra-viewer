import { take } from "lodash-es"
import { Twist } from "types"
import Classical from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import { withOrigin } from "math/geom"
import {
  getTwistSign,
  getTransformedVertices,
  expandEdges,
} from "../operationUtils"
import makeOperation from "../makeOperation"
import {
  getSnubAngle,
  getExpandedFaces,
  isExpandedFace,
  getResizedVertices,
} from "./resizeUtils"

// TODO figure out a way to deduplicate these functions?
// (or not)
function doSemiExpansion(polyhedron: Polyhedron, reference: Polyhedron) {
  const largeFaceType = polyhedron.largestFace().numSides
  const referenceFace = reference.faceWithNumSides(largeFaceType)
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength()
  const largeFaceIndices = polyhedron.faces
    .filter((face) => face.numSides === largeFaceType)
    .map((face) => face.index)

  const duplicated = expandEdges(
    polyhedron,
    polyhedron.edges.filter((e) =>
      e.adjacentFaces().every((f) => f.numSides === largeFaceType),
    ),
  )
  const expandFaces = duplicated.faces.filter((face) =>
    largeFaceIndices.includes(face.index),
  )
  const endVertices = getResizedVertices(expandFaces, referenceLength)
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  }
}

function doExpansion(
  polyhedron: Polyhedron,
  reference: Polyhedron,
  twist?: Twist,
) {
  const n = polyhedron.getFace().numSides
  const duplicated = expandEdges(polyhedron, polyhedron.edges, twist)

  // TODO precalculate this
  const referenceFace =
    reference.faces.find((face) => isExpandedFace(reference, face, n)) ??
    reference.getFace()
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength()

  const expandFaces = duplicated.faces.filter((face) =>
    isExpandedFace(duplicated, face, n),
  )
  const refFaces = getExpandedFaces(reference, n)
  const angle = twist
    ? getTwistSign(twist) * Math.abs(getSnubAngle(reference, refFaces))
    : 0

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(expandFaces, referenceLength, angle)

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  }
}

export const expand = makeOperation<Classical>("expand", {
  apply({ specs, geom }, $, result) {
    if (specs.isTruncated()) {
      return doSemiExpansion(geom, result)
    }
    return doExpansion(geom, result)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return info.isRegular() || info.isTruncated()
  },

  getResult({ specs }) {
    return specs.withData({
      operation: specs.isRegular() ? "cantellate" : "bevel",
    })
  },
})

interface SnubOpts {
  twist: Twist
}
export const snub = makeOperation<Classical, SnubOpts>("snub", {
  apply({ geom }, { twist = "left" }, result) {
    return doExpansion(geom, result, twist)
  },

  canApplyTo(info): info is Classical {
    return info.isClassical() && info.isRegular()
  },

  getResult({ specs }) {
    return specs.withData({ operation: "snub" })
  },

  hasOptions(info) {
    return !info.isTetrahedral()
  },

  *allOptionCombos() {
    yield { twist: "left" }
    yield { twist: "right" }
  },
})

export const dual = makeOperation<Classical>("dual", {
  apply({ geom }) {
    // Scale to create a dual polyhedron with the same midradius
    const scale = (() => {
      const f = geom.getFace().distanceToCenter()
      const e = geom.getEdge().distanceToCenter()
      return (e * e) / (f * f)
    })()
    const duplicated = expandEdges(geom, geom.edges)
    const faces = take(duplicated.faces, geom.numFaces())
    const endVertices = getTransformedVertices(faces, (f) =>
      withOrigin(geom.centroid(), (v) => v.scale(scale))(f.centroid()),
    )

    return {
      animationData: {
        start: duplicated,
        endVertices,
      },
    }
  },

  canApplyTo(info): info is Classical {
    return info.isClassical() && info.isRegular()
  },

  getResult({ specs }) {
    if (specs.isTetrahedral()) return specs
    return specs.withData({ facet: specs.isFace() ? "vertex" : "face" })
  },
})
