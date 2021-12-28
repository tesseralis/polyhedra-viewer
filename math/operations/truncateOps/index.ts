import { oppositeFacet } from "specs"
import { combineOps } from "../operationPairs"
import Operation, { OpArgs } from "../Operation"
import { FacetOpts } from "../operationUtils"
import { Classical } from "specs"
import regs from "./truncateRegular"
import ambos, { semisnubAmbo } from "./truncateAmbo"
import augTruncate from "./truncateAugmented"
import * as capstones from "./truncateCapstone"

export const truncate = new Operation(
  "truncate",
  combineOps([regs.truncate.left, ambos.truncate.left, augTruncate.left]),
)

export const pare = new Operation(
  "pare",
  combineOps([regs.pare.left, ambos.pare.left]),
)

export const alternate = new Operation(
  "alternate",
  combineOps([capstones.alternate.left]),
)

export const unalternate = new Operation("alternate", {
  graph: function* () {},
  toGraphOpts() {},
  apply() {
    throw new Error("Not implemented")
  },
})

const hitOptArgs: Partial<OpArgs<FacetOpts, Classical>> = {
  hitOption: "facet",
  getHitOption(forme, hitPoint) {
    const face = forme.geom.hitFace(hitPoint)
    const facet = forme.getFacet(face)
    return facet ? { facet: oppositeFacet(facet) } : {}
  },

  selectionState(face, forme, { facet }) {
    if (facet && forme.isFacetFace(face, oppositeFacet(facet)))
      return "selected"
    return "selectable"
  },
}

export const sharpen = new Operation("sharpen", {
  ...combineOps<Partial<FacetOpts>>([
    regs.truncate.right,
    ambos.truncate.right,
    augTruncate.right,
  ]),
  // TODO split up sharpening rectified and sharpening truncated
  ...hitOptArgs,
})

// TODO the following operators are unused right now
// and need to be integrated into the app

// TODO why doesn't the typing work here?
export const pinch = new Operation("pinch", {
  ...combineOps<any>([regs.pare.right, ambos.pare.right]),
  ...hitOptArgs,
})

export const rectify = new Operation(
  "rectify",
  combineOps([regs.rectify.left, ambos.rectify.left, capstones.rectify.left]),
)

export const unrectify = new Operation("connect", {
  ...combineOps<any>([
    regs.rectify.right,
    ambos.rectify.right,
    capstones.rectify.right,
  ]),
  ...hitOptArgs,
})

export const semisnub = new Operation(
  "semisnub",
  combineOps([semisnubAmbo.left]),
)

export const unsnub = new Operation("unsnub", {
  ...combineOps<any>([semisnubAmbo.right]),
  ...hitOptArgs,
})
