import { combineOps } from "../operationPairs"
import { FacetOpts } from "../operationUtils"
import Operation, { makeOperation } from "../Operation"
import * as classicals from "./resizeClassical"
import * as prisms from "./resizePrism"
import * as pyramids from "./resizePyramid"

export const dual = new Operation(
  "dual",
  combineOps([
    classicals.dual.left,
    classicals.dual.right,
    prisms.dual.left,
    prisms.dual.right,
    pyramids.dual.left,
  ]),
)

export const expand = new Operation(
  "expand",
  combineOps(
    [
      classicals.semiExpand,
      classicals.expand,
      prisms.expand,
      pyramids.expand,
    ].map((op) => op.left),
  ),
)

export const snub = makeOperation(
  "snub",
  combineOps([classicals.snub.left, pyramids.snub.left]),
)

export const twist = makeOperation(
  "twist",
  combineOps([
    classicals.twist.left,
    classicals.twist.right,
    pyramids.twist.left,
    pyramids.twist.right,
  ]),
)

export const contract = makeOperation<FacetOpts>("contract", {
  ...combineOps<any>(
    [
      classicals.expand,
      classicals.snub,
      classicals.semiExpand,
      prisms.expand,
      pyramids.expand,
      pyramids.snub,
    ].map((op) => op.right),
  ),

  hitOption: "facet",
  getHitOption(forme, hitPoint) {
    const hitFace = forme.geom.hitFace(hitPoint)
    const facet = forme.getFacet(hitFace)
    return facet ? { facet } : {}
  },

  selectionState(face, forme, { facet }) {
    if (facet && forme.isFacetFace(face, facet)) return "selected"
    if (forme.isAnyFacetFace(face)) return "selectable"
    return undefined
  },
})
