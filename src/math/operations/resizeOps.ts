import { Twist } from "types"
import Classical from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import Operation from "./Operation"
import {
  expand as _expand,
  semiExpand,
  snub as _snub,
  twist as _twist,
  dual as _dual,
} from "../operations-new/resizeOps"
import { isExpandedFace } from "../operations-new/resizeUtils"
import { toOpArgs } from "./adapters"

export const expand = new Operation<{}, Classical>(
  "expand",
  toOpArgs("left", [semiExpand, _expand]),
)

interface SnubOpts {
  twist: Twist
}
export const snub = new Operation<SnubOpts, Classical>("snub", {
  apply(solid, { twist = "left" }) {
    return _snub.applyLeft(solid, { twist })
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return _snub.canApplyLeftTo(info)
  },

  getResult({ specs }) {
    return _snub.getRight(specs)
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
      return _dual.applyRight(solid, {})
    } else {
      return _dual.applyLeft(solid, {})
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
    if (_expand.canApplyRightTo(specs)) {
      return _expand.applyRight(solid, options)
    }
    if (_snub.canApplyRightTo(specs)) {
      const shapeTwist = getChirality(geom)
      return _snub.applyRight(
        {
          geom,
          specs: specs.withData({ twist: shapeTwist }),
        },
        options,
      )
    }
    return semiExpand.applyRight(solid, options)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    if (_expand.canApplyRightTo(info)) return true
    if (_snub.canApplyRightTo(info)) return true
    if (semiExpand.canApplyRightTo(info)) return true
    return false
  },

  getResult({ specs, geom }, options) {
    if (_expand.canApplyRightTo(specs)) {
      return _expand.getLeft(specs, options)
    }
    if (_snub.canApplyRightTo(specs)) {
      const shapeTwist = getChirality(geom)
      return _snub.getLeft(specs.withData({ twist: shapeTwist }), options)
    }
    return semiExpand.getLeft(specs, options)
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
      return _twist.applyRight(
        {
          geom,
          specs: specs.withData({ twist: shapeTwist }),
        },
        {},
      )
    }
    return _twist.applyLeft(solid, options)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return _twist.canApplyLeftTo(info) || _twist.canApplyRightTo(info)
  },

  getResult(solid, options) {
    if (solid.specs.isSnub()) {
      return _twist.getLeft(solid.specs, options)
    }
    return _twist.getRight(solid.specs, options)
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
