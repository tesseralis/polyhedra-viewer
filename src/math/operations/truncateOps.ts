import Classical from "data/specs/Classical"
import Operation, { OpArgs } from "./Operation"
import {
  amboTruncate,
  truncate as _truncate,
  rectify as _rectify,
  cotruncate as _cotruncate,
} from "../operations-new/truncate"
import { combineOps } from "./adapters"

export const truncate = new Operation(
  "truncate",
  combineOps([_truncate.left, amboTruncate.left]),
)

export const cotruncate = new Operation("cotruncate", _cotruncate.left)

export const rectify = new Operation("rectify", _rectify.left)

export const sharpen = new Operation(
  "sharpen",
  combineOps([_truncate.right, amboTruncate.right]),
)

interface FacetOpts {
  facet?: "vertex" | "face"
}

const hitOptArgs: Partial<OpArgs<FacetOpts, Classical>> = {
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
}

export const cosharpen = new Operation("cosharpen", {
  ..._cotruncate.right,
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ..._rectify.right,
  ...hitOptArgs,
})
