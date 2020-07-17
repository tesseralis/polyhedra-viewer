import { Twist } from "types"
import Classical from "data/specs/Classical"
import Operation from "./Operation"
import {
  expand as _expand,
  semiExpand,
  snub as _snub,
  twist as _twist,
  dual as _dual,
} from "../operations-new/resizeOps"
import { isExpandedFace } from "../operations-new/resizeUtils"
import { toOpArgs, selfDualOpArgs } from "./adapters"

export const expand = new Operation(
  "expand",
  toOpArgs("left", [semiExpand, _expand]),
)

interface TwistOpts {
  twist?: Twist
}

export const snub = new Operation<TwistOpts, Classical>("snub", {
  ...toOpArgs("left", [_snub]),

  *allOptionCombos({ specs }) {
    if (specs.isTetrahedral()) {
      yield {}
    } else {
      yield { twist: "left" }
      yield { twist: "right" }
    }
  },
})

export const dual = new Operation("dual", selfDualOpArgs(_dual))

interface FacetOpts {
  facet?: "vertex" | "face"
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = new Operation<FacetOpts, Classical>("contract", {
  ...toOpArgs("right", [_expand, _snub, semiExpand]),

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

export const twist = new Operation<TwistOpts, Classical>("twist", {
  ...selfDualOpArgs(_twist),

  *allOptionCombos({ specs }) {
    if (!specs.isSnub() && !specs.isTetrahedral()) {
      yield { twist: "left" }
      yield { twist: "right" }
    }
    yield {}
  },
})
