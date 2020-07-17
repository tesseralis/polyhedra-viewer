import Classical from "data/specs/Classical"
import Operation from "./Operation"
import {
  amboTruncate,
  truncate as _truncate,
  rectify as _rectify,
  cotruncate as _cotruncate,
} from "../operations-new/truncate"
import { toOpArgs } from "./adapters"

export const truncate = new Operation(
  "truncate",
  toOpArgs("left", [_truncate, amboTruncate]),
)

export const cotruncate = new Operation(
  "cotruncate",
  toOpArgs("left", [_cotruncate]),
)

export const rectify = new Operation("rectify", toOpArgs("left", [_rectify]))

export const sharpen = new Operation(
  "sharpen",
  toOpArgs("right", [_truncate, amboTruncate]),
)

interface FacetOpts {
  facet?: "vertex" | "face"
}

export const cosharpen = new Operation<FacetOpts, Classical>("cosharpen", {
  ...toOpArgs("right", [_cotruncate]),
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

export const unrectify = new Operation<FacetOpts, Classical>("unrectify", {
  ...toOpArgs("right", [_rectify]),
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
