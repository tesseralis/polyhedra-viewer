import { combineOps } from "../operationPairs"
import { FacetOpts } from "../operationUtils"
import Operation, { makeOperation } from "../Operation"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"
import * as classicals from "./resizeClassical"
import * as prisms from "./resizePrism"
import regularDual from "./dualRegular"

type ResizeForme = ClassicalForme | CapstoneForme

export const dual = new Operation(
  "dual",
  combineOps<ResizeForme, {}>([
    regularDual.left,
    regularDual.right,
    prisms.dual.left,
    prisms.dual.right,
  ]),
)

export const expand = new Operation(
  "expand",
  combineOps<ResizeForme, {}>([
    classicals.semiExpand.left,
    classicals.expand.left,
    prisms.expand.left,
  ]),
)

export const snub = makeOperation("snub", classicals.snub.left)

export const twist = makeOperation(
  "twist",
  combineOps([classicals.twist.left, classicals.twist.right]),
)

export const contract = makeOperation<FacetOpts, ResizeForme>("contract", {
  ...combineOps<ResizeForme, FacetOpts>(
    [
      classicals.expand,
      classicals.snub,
      classicals.semiExpand,
      prisms.expand,
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
