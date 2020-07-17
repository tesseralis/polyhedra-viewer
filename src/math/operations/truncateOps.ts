import Classical from "data/specs/Classical"
import Operation from "./Operation"
import {
  amboTruncate,
  truncate as _truncate,
  rectify as _rectify,
} from "../operations-new/truncate"

export const truncate = new Operation<{}, Classical>("truncate", {
  apply(solid) {
    if (amboTruncate.canApplyLeftTo(solid.specs))
      return amboTruncate.applyLeft(solid, {})
    return _truncate.applyLeft(solid, {})
  },
  getResult({ specs }) {
    if (amboTruncate.canApplyLeftTo(specs)) {
      return amboTruncate.getRight(specs)
    }
    return _truncate.getRight(specs)
  },
  canApplyTo(info): info is Classical {
    return amboTruncate.canApplyLeftTo(info) || _truncate.canApplyLeftTo(info)
  },
})

export const rectify = new Operation<{}, Classical>("rectify", {
  apply: (solid) => _rectify.applyLeft(solid, {}),
  getResult: ({ specs }) => _rectify.getRight(specs),
  canApplyTo(info): info is Classical {
    return _rectify.canApplyLeftTo(info)
  },
})

interface Options {
  facet?: "vertex" | "face"
}

export const sharpen = new Operation<Options, Classical>("sharpen", {
  apply(solid, options) {
    if (amboTruncate.canApplyRightTo(solid.specs)) {
      return amboTruncate.applyRight(solid, options)
    }
    if (_rectify.canApplyRightTo(solid.specs)) {
      return _rectify.applyRight(solid, options)
    }
    return _truncate.applyRight(solid, {})
  },

  canApplyTo(info): info is Classical {
    if (amboTruncate.canApplyRightTo(info)) return true
    if (_truncate.canApplyRightTo(info)) return true
    if (_rectify.canApplyRightTo(info)) return true
    return false
  },

  getResult({ specs }, options) {
    if (specs.isRectified()) {
      // if rectified, we have to figure out the facet from the faceType
      return _rectify.getLeft(specs, options)
    }
    if (amboTruncate.canApplyRightTo(specs)) {
      return amboTruncate.getLeft(specs)
    }
    return _truncate.getLeft(specs)
  },

  hasOptions(info) {
    if (_truncate.canApplyRightTo(info)) return false
    return !info.isTetrahedral() && info.isRectified()
  },

  *allOptionCombos({ specs }) {
    if (_truncate.canApplyRightTo(specs)) {
      yield {}
    } else if (specs.isRectified() && !specs.isTetrahedral()) {
      yield { facet: "face" }
      yield { facet: "vertex" }
    } else {
      yield {}
    }
  },

  hitOption: "facet",
  getHitOption({ geom }, hitPoint) {
    const n = geom.hitFace(hitPoint).numSides
    return n <= 5 ? { facet: n === 3 ? "face" : "vertex" } : {}
  },

  faceSelectionStates({ specs, geom }, { facet }) {
    const faceType = !facet ? null : facet === "face" ? 3 : specs.data.family
    return geom.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
})
