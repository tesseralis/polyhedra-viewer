import { Twist } from "types"
import Classical from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import Operation from "./Operation"
import {
  expand as metaExpand,
  semiExpand as metaSemiExpand,
  snub as metaSnub,
  twist as metaTwist,
  dual as metaDual,
} from "../operations-new/resizeOps"
import { isExpandedFace } from "../operations-new/resizeUtils"
import { makeComboOp } from "./adapters"

const expandCombo = makeComboOp("left", [metaSemiExpand, metaExpand])
export const expand = new Operation<{}, Classical>("expand", {
  apply(solid) {
    const { specs } = solid
    return expandCombo.get(specs).applyLeft(solid, { facet: specs.data.facet })
  },

  canApplyTo(info): info is Classical {
    return expandCombo.has(info)
  },

  getResult({ specs }) {
    return expandCombo.get(specs).getRight(specs)
  },
})

interface SnubOpts {
  twist: Twist
}
export const snub = new Operation<SnubOpts, Classical>("snub", {
  apply(solid, { twist = "left" }) {
    return metaSnub.applyLeft(solid, { twist })
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return metaSnub.canApplyLeftTo(info)
  },

  getResult({ specs }) {
    return metaSnub.getRight(specs)
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
  apply(solid) {
    if (solid.specs.isVertex()) {
      return metaDual.applyRight(solid, {})
    } else {
      return metaDual.applyLeft(solid, {})
    }
  },

  // TODO replace this with the info from the operation
  canApplyTo(info): info is Classical {
    return info.isClassical() && info.isRegular()
  },

  getResult({ specs }) {
    if (specs.isTetrahedral()) return specs
    return specs.withData({ facet: specs.isFace() ? "vertex" : "face" })
  },
})

function getChirality(geom: Polyhedron) {
  if (geom.largestFace().numSides === 3) {
    return "left"
  }
  const face = geom.faces.find((f) => f.numSides !== 3)!
  const other = face.edges[0].twin().prev().twin().next().twinFace()
  return other.numSides !== 3 ? "right" : "left"
}

interface Options {
  facet?: "vertex" | "face"
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

interface TwistOpts {
  twist?: Twist
}

export const twist = new Operation<TwistOpts, Classical>("twist", {
  apply(solid, options) {
    const { specs, geom } = solid
    if (specs.isSnub()) {
      const shapeTwist = getChirality(geom)
      return metaTwist.applyRight(
        {
          geom,
          specs: specs.withData({ twist: shapeTwist }),
        },
        {},
      )
    }
    return metaTwist.applyLeft(solid, options)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return metaTwist.canApplyLeftTo(info) || metaTwist.canApplyRightTo(info)
  },

  getResult(solid, options) {
    if (solid.specs.isSnub()) {
      return metaTwist.getLeft(solid.specs, options)
    }
    return metaTwist.getRight(solid.specs, options)
  },

  hasOptions(info) {
    return !info.isTetrahedral() && info.isCantellated()
  },

  *allOptionCombos({ specs }) {
    if (!specs.isSnub() && !specs.isTetrahedral()) {
      yield { twist: "left" }
      yield { twist: "right" }
    }
    yield {}
  },
})
