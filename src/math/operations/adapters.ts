import OperationPair, { Side } from "../operations-new/OperationPair"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"

export function makeComboOp<Specs extends PolyhedronSpecs, Options>(
  side: Side,
  ops: OperationPair<Specs, Options>[],
) {
  return {
    has(specs: PolyhedronSpecs) {
      return ops.some((op) => op.canApplyTo(side, specs))
    },
    get(specs: Specs) {
      const op = ops.find((op) => op.canApplyTo(side, specs))
      if (!op) {
        throw new Error(`Could not apply any operations to ${specs.name}`)
      }
      return op
    },
  }
}
