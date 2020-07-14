import Classical from "data/specs/Classical"
import Operation from "../Operation"
import {
  truncate as metaTruncate,
  rectify as metaRectify,
} from "../../operations-new/truncate"

interface Options {
  faceType?: number
}

export const sharpen = new Operation<Options, Classical>("sharpen", {
  apply({ specs, geom }, { faceType }) {
    if (specs.isRectified()) {
      return metaRectify.unapply(
        geom,
        specs.isTetrahedral()
          ? {}
          : { facet: faceType === 3 ? "face" : "vertex" },
      )
    }
    return metaTruncate.unapply(geom, {})
  },

  canApplyTo(info): info is Classical {
    if (metaTruncate.canUnapplyTo(info)) return true
    if (metaRectify.canUnapplyTo(info)) return true
    return false
  },

  getResult({ specs }, { faceType }) {
    if (specs.isRectified()) {
      // if rectified, we have to figure out the facet from the faceType
      return specs.withData({
        operation: "regular",
        facet: faceType === 3 ? "face" : "vertex",
      })
    } else {
      return metaTruncate.getSource(specs)
    }
  },

  hasOptions(info) {
    if (metaTruncate.canUnapplyTo(info)) return false
    return !info.isTetrahedral() && info.isRectified()
  },

  *allOptionCombos({ specs }) {
    if (metaTruncate.canUnapplyTo(specs)) {
      yield {}
    } else if (specs.isRectified() && !specs.isTetrahedral()) {
      yield { faceType: 3 }
      yield { faceType: specs.data.family }
    } else {
      yield {}
    }
  },

  hitOption: "faceType",
  getHitOption({ geom }, hitPoint) {
    const n = geom.hitFace(hitPoint).numSides
    return n <= 5 ? { faceType: n } : {}
  },

  faceSelectionStates({ geom }, { faceType = -1 }) {
    return geom.faces.map((face) => {
      if (face.numSides === faceType) return "selected"
      return "selectable"
    })
  },
})
