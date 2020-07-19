import { Twist } from "types"
import Classical from "data/specs/Classical"
import Operation from "./Operation"
import { Polyhedron, Face } from "math/polyhedra"
import {
  expand as _expand,
  semiExpand,
  snub as _snub,
  twist as _twist,
  dual as _dual,
} from "../operations-new/resizeOps"
import { combineOps } from "./adapters"

type ExpansionType = "cantellate" | "snub"

function expansionType(polyhedron: Polyhedron): ExpansionType {
  return polyhedron.getVertex().adjacentFaceCounts()[3] >= 3
    ? "snub"
    : "cantellate"
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
}

// TODO replace with isCantellatedFace and isSnubFace
export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron)
  if (typeof nSides === "number" && face.numSides !== nSides) return false
  if (!face.isValid()) return false
  return face.adjacentFaces().every((f) => f.numSides === edgeShape[type])
}

export const expand = new Operation(
  "expand",
  combineOps([semiExpand.left, _expand.left]),
)

interface TwistOpts {
  twist?: Twist
}

export const snub = new Operation("snub", _snub.left)

export const dual = new Operation("dual", combineOps([_dual.left, _dual.right]))

interface FacetOpts {
  facet?: "vertex" | "face"
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = new Operation<FacetOpts, Classical>("contract", {
  ...combineOps([_expand, _snub, semiExpand].map((op) => op.right)),

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

export const twist = new Operation<TwistOpts, Classical>(
  "twist",
  combineOps([_twist.left, _twist.right]),
)
