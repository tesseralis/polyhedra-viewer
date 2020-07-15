import { take } from "lodash-es"
import { Twist } from "types"
import Classical from "data/specs/Classical"
import { withOrigin } from "math/geom"
import { getTransformedVertices, expandEdges } from "../operationUtils"
import Operation from "../Operation"
import {
  expand as metaExpand,
  semiExpand as metaSemiExpand,
  snub as metaSnub,
} from "../../operations-new/expand"

export const expand = new Operation<{}, Classical>("expand", {
  apply(solid) {
    const { specs } = solid
    if (specs.isTruncated()) {
      return metaSemiExpand.apply(solid, { facet: specs.data.facet })
    }
    return metaExpand.apply(solid, { facet: specs.data.facet })
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return metaSemiExpand.canApplyTo(info) || metaExpand.canApplyTo(info)
  },

  getResult({ specs }) {
    if (specs.isTruncated()) {
      return metaSemiExpand.getResult(specs)
    }
    return metaExpand.getResult(specs)
  },
})

interface SnubOpts {
  twist: Twist
}
export const snub = new Operation<SnubOpts, Classical>("snub", {
  apply(solid, { twist = "left" }) {
    return metaSnub.apply(solid, { twist })
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
