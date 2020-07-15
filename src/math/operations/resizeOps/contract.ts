import { Polygon } from "data/polygons"
import Classical from "data/specs/Classical"
import { isExpandedFace } from "./resizeUtils"
import Operation from "../Operation"
import {
  expand as metaExpand,
  snub as metaSnub,
  semiExpand as metaSemiExpand,
} from "../../operations-new/expand"

// TODO hopefully there's a better way to do this once we make the new opGraph
type FaceType = Polygon

interface Options {
  facet?: "vertex" | "face"
}

// function getChirality(geom: Polyhedron) {
//   if (geom.largestFace().numSides === 3) {
//     return "left"
//   }
//   const face = geom.faces.find((f) => f.numSides !== 3)!
//   const other = face.edges[0].twin().prev().twin().next().twinFace()
//   return other.numSides !== 3 ? "right" : "left"
// }

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = new Operation<Options, Classical>("contract", {
  apply({ specs, geom }, options) {
    if (metaExpand.canUnapplyTo(specs)) {
      const opts = specs.isTetrahedral() ? {} : options
      return metaExpand.unapply(geom, opts)
    }
    if (metaSnub.canUnapplyTo(specs)) {
      // const shapeTwist = getChirality(geom)
      // const oppTwist = shapeTwist === "left" ? "right" : "left"
      // const twist = options.faceType === 3 ? oppTwist : shapeTwist
      // FIXME translate face-type args to twist
      // return metaSnub.unapply(geom, {twist})
      return metaSnub.unapply(geom, {})
    }
    return metaSemiExpand.unapply(geom, options)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    if (metaExpand.canUnapplyTo(info)) return true
    if (metaSnub.canUnapplyTo(info)) return true
    if (metaSemiExpand.canUnapplyTo(info)) return true
    return false
  },

  getResult({ specs }, options) {
    if (metaExpand.canUnapplyTo(specs)) {
      return metaExpand.getSource(specs, options)
    }
    if (metaSnub.canUnapplyTo(specs)) {
      // const shapeTwist = getChirality(geom)
      // const oppTwist = shapeTwist === "left" ? "right" : "left"
      // const twist = faceType === 3 ? oppTwist : shapeTwist
      // return metaSnub.getSource(specs, { twist })
      return metaSnub.getSource(specs)
    }
    return metaSemiExpand.getSource(specs, options)
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
    const faceType = hitFace.numSides as FaceType // TODO unsure if always valid
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
