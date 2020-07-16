import { Twist } from "types"
import Classical from "data/specs/Classical"
import Operation from "../Operation"
import {
  expand as metaExpand,
  semiExpand as metaSemiExpand,
  snub as metaSnub,
  dual as metaDual,
} from "../../operations-new/resizeOps"

export const expand = new Operation<{}, Classical>("expand", {
  apply(solid) {
    const { specs } = solid
    if (specs.isTruncated()) {
      return metaSemiExpand.applyLeft(solid, { facet: specs.data.facet })
    }
    return metaExpand.applyLeft(solid, { facet: specs.data.facet })
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return (
      metaSemiExpand.canApplyLeftTo(info) || metaExpand.canApplyLeftTo(info)
    )
  },

  getResult({ specs }) {
    if (specs.isTruncated()) {
      return metaSemiExpand.getRight(specs)
    }
    return metaExpand.getRight(specs)
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
