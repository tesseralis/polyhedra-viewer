import Classical from "data/specs/Classical"
import Operation from "../Operation"
import {
  truncate as metaTruncate,
  rectify as metaRectify,
} from "../../operations-new/truncate"

export const truncate = new Operation<{}, Classical>("truncate", {
  apply(solid) {
    return metaTruncate.apply(solid, {})
  },

  canApplyTo(info): info is Classical {
    return metaTruncate.canApplyTo(info)
  },

  getResult({ specs }) {
    return metaTruncate.getResult(specs)
  },
})

export const rectify = new Operation<{}, Classical>("rectify", {
  apply(solid) {
    return metaRectify.apply(solid, {})
  },

  canApplyTo(info): info is Classical {
    return metaRectify.canApplyTo(info)
  },

  getResult({ specs }) {
    return metaRectify.getResult(specs)
  },
})
