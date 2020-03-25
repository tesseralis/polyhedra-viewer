import { every, take } from "lodash-es"
import { Twist } from "types"
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

/**
 * Duplication function for semi-expanding truncated polyhedra
 */

function isTruncated(polyhedron: Polyhedron) {
  if (!polyhedron.info.isClassical()) {
    throw new Error("Invalid polyhedron")
  }
  return polyhedron.info.data.operation === "truncate"
}

// TODO figure out a way to deduplicate these functions?
// (or not)
function doSemiExpansion(polyhedron: Polyhedron, referenceName: string) {
  const reference = Polyhedron.get(referenceName)
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
      every(e.adjacentFaces(), (f) => f.numSides === largeFaceType),
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
  referenceName: string,
  twist?: Twist,
) {
  const reference = Polyhedron.get(referenceName)
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

export const expand = makeOperation("expand", {
  apply(polyhedron, $, result) {
    if (isTruncated(polyhedron)) {
      return doSemiExpansion(polyhedron, result)
    }
    return doExpansion(polyhedron, result)
  },
})

interface SnubOpts {
  twist: Twist
}
export const snub = makeOperation<SnubOpts>("snub", {
  apply(polyhedron, { twist = "left" }, result) {
    return doExpansion(polyhedron, result, twist)
  },
  optionTypes: ["twist"],
  allOptionCombos() {
    return [{ twist: "left" }, { twist: "right" }]
  },
})

export const dual = makeOperation("dual", {
  apply(polyhedron) {
    // Scale to create a dual polyhedron with the same midradius
    const scale = (() => {
      const f = polyhedron.getFace().distanceToCenter()
      const e = polyhedron.getEdge().distanceToCenter()
      return (e * e) / (f * f)
    })()
    const duplicated = expandEdges(polyhedron, polyhedron.edges)
    const faces = take(duplicated.faces, polyhedron.numFaces())
    const endVertices = getTransformedVertices(faces, (f) =>
      withOrigin(polyhedron.centroid(), (v) => v.scale(scale))(f.centroid()),
    )

    return {
      animationData: {
        start: duplicated,
        endVertices,
      },
    }
  },
})
