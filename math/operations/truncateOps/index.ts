import { oppositeFacet } from "specs"
import { combineOps } from "../operationPairs"
import Operation, { OpArgs } from "../Operation"
import { FacetOpts } from "../operationUtils"
import { Classical } from "specs"
import regs from "./truncateRegular"
import ambos, { semisnubAmbo } from "./truncateAmbo"
import augTruncate from "./truncateAugmented"

export const truncate = new Operation(
  "truncate",
  combineOps([regs.truncate.left, ambos.truncate.left, augTruncate.left]),
)

export const cotruncate = new Operation(
  "cotruncate",
  combineOps([regs.cotruncate.left, ambos.cotruncate.left]),
)

export const rectify = new Operation(
  "rectify",
  combineOps([regs.rectify.left, ambos.rectify.left]),
)

export const semisnub = new Operation(
  "semisnub",
  combineOps([semisnubAmbo.left]),
)

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
    // regs.rectify.right,
    // ambos.rectify.right,
    // semisnubAmbo.right,
  ]),
  // TODO split up sharpening rectified and sharpening truncated
  ...hitOptArgs,
})

// TODO the following operators are unused right now
// and need to be integrated into the app

// TODO why doesn't the typing work here?
export const cosharpen = new Operation("cosharpen", {
  ...combineOps<any>([regs.cotruncate.right, ambos.cotruncate.right]),
  ...hitOptArgs,
})

export const unrectify = new Operation("unrectify", {
  ...combineOps<any>([
    regs.rectify.right,
    ambos.rectify.right,
    semisnubAmbo.right,
  ]),
  ...hitOptArgs,
})