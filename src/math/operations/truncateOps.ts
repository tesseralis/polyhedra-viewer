import Classical from "data/specs/Classical"
import Operation from "./Operation"
import {
  amboTruncate,
  truncate as _truncate,
  rectify as _rectify,
  cotruncate as _cotruncate,
} from "../operations-new/truncate"

import { makeComboOp } from "./adapters"
const truncateCombo = makeComboOp("left", [_truncate, amboTruncate])
export const truncate = new Operation<{}, Classical>("truncate", {
  apply(solid) {
    return truncateCombo.get(solid.specs).applyLeft(solid, {})
  },
  getResult({ specs }) {
    return truncateCombo.get(specs).getRight(specs)
  },
  canApplyTo(info): info is Classical {
    return truncateCombo.has(info)
  },
})

export const cotruncate = new Operation<{}, Classical>("cotruncate", {
  apply: (solid) => _cotruncate.applyLeft(solid, {}),
  getResult: ({ specs }) => _cotruncate.getRight(specs),
  canApplyTo(info): info is Classical {
    return _cotruncate.canApplyLeftTo(info)
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

export const sharpen = new Operation<{}, Classical>("sharpen", {
  apply(solid) {
    if (amboTruncate.canApplyRightTo(solid.specs)) {
      return amboTruncate.applyRight(solid, {})
    }
    return _truncate.applyRight(solid, {})
  },

  canApplyTo(info): info is Classical {
    if (amboTruncate.canApplyRightTo(info)) return true
    if (_truncate.canApplyRightTo(info)) return true
    return false
  },

  getResult({ specs }) {
    if (amboTruncate.canApplyRightTo(specs)) {
      return amboTruncate.getLeft(specs)
    }
    return _truncate.getLeft(specs)
  },
})

export const cosharpen = new Operation<Options, Classical>("cosharpen", {
  apply(solid, options) {
    return _cotruncate.applyRight(solid, options)
  },
  canApplyTo(info): info is Classical {
    return _cotruncate.canApplyRightTo(info)
  },
  getResult({ specs }, options) {
    return _cotruncate.getLeft(specs, options)
  },
  // FIXME deduplicate with unrectify
  hasOptions(info) {
    return !info.isTetrahedral() && info.isRectified()
  },
  *allOptionCombos({ specs }) {
    if (specs.isRectified() && !specs.isTetrahedral()) {
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

export const unrectify = new Operation<Options, Classical>("unrectify", {
  apply(solid, options) {
    return _rectify.applyRight(solid, options)
  },
  canApplyTo(info): info is Classical {
    return _rectify.canApplyRightTo(info)
  },
  getResult({ specs }, options) {
    return _rectify.getLeft(specs, options)
  },
  hasOptions(info) {
    return !info.isTetrahedral() && info.isRectified()
  },
  *allOptionCombos({ specs }) {
    if (specs.isRectified() && !specs.isTetrahedral()) {
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
