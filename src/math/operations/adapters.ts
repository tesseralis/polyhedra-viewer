import OperationPair, { Side, Opts } from "../operations-new/OperationPair"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { OpArgs } from "./Operation"

export function makeComboOp<Specs extends PolyhedronSpecs, L, R>(
  side: Side,
  ops: OperationPair<Specs, L, R>[],
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

/**
 * Convert the list of operation pairs to the necessary OpArgs to create an operation.
 * Assumes that each op pair works on a disjoint set of polyhedra
 */
export function toOpArgs<Specs extends PolyhedronSpecs, L, R>(
  side: Side,
  opPairs: OperationPair<Specs, L, R>[],
): OpArgs<Opts<Side, L, R>, Specs> {
  const combo = makeComboOp(side, opPairs)
  return {
    apply(solid, opts) {
      return combo.get(solid.specs).apply(side, solid, opts)
    },
    canApplyTo(specs): specs is Specs {
      return combo.has(specs)
    },
    getResult(solid, opts) {
      return combo.get(solid.specs).getOpposite(side, solid.specs, opts)
    },
    hasOptions(specs) {
      return combo.get(specs).hasOptions(side, specs)
    },
  }
}
