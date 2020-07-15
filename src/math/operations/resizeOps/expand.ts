import { take } from "lodash-es"
import { Twist } from "types"
import Classical from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import { withOrigin } from "math/geom"
import { getTransformedVertices, expandEdges } from "../operationUtils"
import Operation from "../Operation"
import { getResizedVertices } from "./resizeUtils"
import {
  expand as metaExpand,
  snub as metaSnub,
} from "../../operations-new/expand"

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

export const expand = new Operation<{}, Classical>("expand", {
  apply({ specs, geom }, $, result) {
    if (specs.isTruncated()) {
      return doSemiExpansion(geom, result)
    }
    return metaExpand.apply(geom, {
      // FIXME make it so we don't need this
      faceType: geom.getFace().numSides as 3 | 4 | 5,
    })
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return info.isTruncated() || metaExpand.canApplyTo(info)
  },

  getResult({ specs }) {
    if (specs.isTruncated()) return specs.withData({ operation: "bevel" })
    return metaExpand.getResult(specs)
  },
})

interface SnubOpts {
  twist: Twist
}
export const snub = new Operation<SnubOpts, Classical>("snub", {
  apply({ geom }, { twist = "left" }) {
    return metaSnub.apply(geom, { twist })
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return metaSnub.canApplyTo(info)
  },

  getResult({ specs }) {
    return metaSnub.getResult(specs)
  },

  hasOptions(info) {
    return !info.isTetrahedral()
  },

  *allOptionCombos({ specs }) {
    if (specs.isTetrahedral()) {
      yield { twist: "left" }
    } else {
      yield { twist: "left" }
      yield { twist: "right" }
    }
  },
})

export const dual = new Operation<{}, Classical>("dual", {
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
