import Classical from "data/specs/Classical"
import { isExpandedFace } from "../../operations-new/resizeUtils"
import { Polyhedron } from "math/polyhedra"
import Operation from "../Operation"
import {
  expand as metaExpand,
  snub as metaSnub,
  semiExpand as metaSemiExpand,
} from "../../operations-new/resizeOps"

interface Options {
  facet?: "vertex" | "face"
}

// FIXME deduplicate with twist
function getChirality(geom: Polyhedron) {
  if (geom.largestFace().numSides === 3) {
    return "left"
  }
  const face = geom.faces.find((f) => f.numSides !== 3)!
  const other = face.edges[0].twin().prev().twin().next().twinFace()
  return other.numSides !== 3 ? "right" : "left"
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = new Operation<Options, Classical>("contract", {
  apply(solid, options) {
    const { specs, geom } = solid
    if (metaExpand.canApplyRightTo(specs)) {
      const opts = specs.isTetrahedral() ? {} : options
      return metaExpand.applyRight(solid, opts)
    }
    if (metaSnub.canApplyRightTo(specs)) {
      const shapeTwist = getChirality(geom)
      const oppTwist = shapeTwist === "left" ? "right" : "left"
      const twist = options.facet === "vertex" ? oppTwist : shapeTwist
      // FIXME translate face-type args to twist
      return metaSnub.applyRight(
        {
          geom,
          specs: specs.withData({ twist: shapeTwist }),
        },
        { twist },
      )
    }
    return metaSemiExpand.applyRight(solid, options)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    if (metaExpand.canApplyRightTo(info)) return true
    if (metaSnub.canApplyRightTo(info)) return true
    if (metaSemiExpand.canApplyRightTo(info)) return true
    return false
  },

  getResult({ specs, geom }, options) {
    if (metaExpand.canApplyRightTo(specs)) {
      return metaExpand.getLeft(specs, options)
    }
    if (metaSnub.canApplyRightTo(specs)) {
      const shapeTwist = getChirality(geom)
      const oppTwist = shapeTwist === "left" ? "right" : "left"
      const twist = options.facet === "vertex" ? oppTwist : shapeTwist
      return metaSnub.getLeft(specs.withData({ twist: shapeTwist }), {
        twist,
      })
    }
    return metaSemiExpand.getLeft(specs, options)
  },

  hasOptions(info) {
    return !info.isTetrahedral()
  },

  *allOptionCombos({ specs }) {
    if (specs.isTetrahedral()) {
      yield {}
    } else {
      yield { facet: "face" }
      yield { facet: "vertex" }
    }
  },

  hitOption: "facet",
  getHitOption({ specs, geom }, hitPoint) {
    const hitFace = geom.hitFace(hitPoint)
    const faceType = hitFace.numSides
    if (specs.isBevelled()) {
      const isValid = hitFace.numSides > 4
      return isValid ? { facet: faceType === 6 ? "vertex" : "face" } : {}
    }
    const isValid = isExpandedFace(geom, hitFace)
    return isValid ? { facet: faceType === 3 ? "vertex" : "face" } : {}
  },

  faceSelectionStates({ specs, geom }, { facet }) {
    if (specs.isBevelled()) {
      return geom.faces.map((face) => {
        const faceType = facet === "vertex" ? 6 : specs.data.family * 2
        if (facet && face.numSides === faceType) {
          return "selected"
        }
        if (face.numSides !== 4) return "selectable"
        return undefined
      })
    }
    const faceType = !facet ? null : facet === "vertex" ? 3 : specs.data.family
    return geom.faces.map((face) => {
      if (faceType && isExpandedFace(geom, face, faceType)) return "selected"
      if (isExpandedFace(geom, face)) return "selectable"
      return undefined
    })
  },
})
