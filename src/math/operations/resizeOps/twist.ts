import { Twist } from "types"
import { Polyhedron } from "math/polyhedra"
import Classical from "data/specs/Classical"
import Operation from "../Operation"

import { twist as metaTwist } from "../../operations-new/expand"

interface Options {
  twist?: Twist
}

function getChirality(geom: Polyhedron) {
  if (geom.largestFace().numSides === 3) {
    return "left"
  }
  const face = geom.faces.find((f) => f.numSides !== 3)!
  const other = face.edges[0].twin().prev().twin().next().twinFace()
  return other.numSides !== 3 ? "right" : "left"
}

export const twist = new Operation<Options, Classical>("twist", {
  apply(solid, options) {
    const { specs, geom } = solid
    if (specs.isSnub()) {
      const shapeTwist = getChirality(geom)
      return metaTwist.unapply(
        {
          geom,
          specs: specs.withData({ twist: shapeTwist }),
        },
        {},
      )
    }
    return metaTwist.apply(solid, options)
  },

  canApplyTo(info): info is Classical {
    if (!info.isClassical()) return false
    return metaTwist.canApplyTo(info) || metaTwist.canUnapplyTo(info)
  },

  getResult(solid, options) {
    if (solid.specs.isSnub()) {
      return metaTwist.getSource(solid.specs, options)
    }
    return metaTwist.getResult(solid.specs, options)
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
