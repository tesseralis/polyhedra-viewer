import { combineOps } from "../operationPairs"
import { FacetOpts } from "../operationUtils"
import Operation, { makeOperation } from "../Operation"
import { Classical, Capstone } from "specs"
import * as classicals from "./resizeClassical"
import * as prisms from "./resizePrism"
import * as pyramids from "./resizePyramid"
import regularDual from "./dualRegular"

type ResizeSpecs = Classical | Capstone

export const dual = new Operation(
  "dual",
  combineOps<ResizeSpecs, {}>([
    regularDual.left,
    regularDual.right,
    prisms.dual.left,
    prisms.dual.right,
  ]),
)

export const expand = new Operation(
  "expand",
  combineOps<ResizeSpecs, {}>(
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
  combineOps<ResizeSpecs, {}>([classicals.snub.left, pyramids.snub.left]),
)

export const twist = makeOperation(
  "twist",
  combineOps<ResizeSpecs, {}>([
    classicals.twist.left,
    classicals.twist.right,
    pyramids.twist.left,
    pyramids.twist.right,
  ]),
)

export const contract = makeOperation<FacetOpts, ResizeSpecs>("contract", {
  ...combineOps<ResizeSpecs, FacetOpts>(
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
