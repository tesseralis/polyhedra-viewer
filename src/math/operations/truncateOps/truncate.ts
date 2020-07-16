import Classical from "data/specs/Classical"
import Operation from "../Operation"
import {
  truncate as metaTruncate,
  rectify as metaRectify,
} from "../../operations-new/truncate"

export const truncate = new Operation<{}, Classical>("truncate", {
  apply(solid) {
    return metaTruncate.applyLeft(solid, {})
  },

  canApplyTo(info): info is Classical {
    return metaTruncate.canApplyLeftTo(info)
  },

  getResult({ specs }) {
    return metaTruncate.getRight(specs)
  },
})

export const rectify = new Operation<{}, Classical>("rectify", {
  apply(solid) {
    return metaRectify.applyLeft(solid, {})
  },

  canApplyTo(info): info is Classical {
    return metaRectify.canApplyLeftTo(info)
  },

  getResult({ specs }) {
    return metaRectify.getRight(specs)
  },
})
