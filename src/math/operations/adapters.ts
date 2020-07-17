import OperationPair, { Side, Opts } from "../operations-new/OperationPair"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { OpArgs } from "./Operation"

interface OpPairEntry<S extends Side, Specs extends PolyhedronSpecs, L, R> {
  side: S
  op: OperationPair<Specs, L, R>
}

function makeComboOp<Specs extends PolyhedronSpecs, L, R>(
  ops: OpPairEntry<Side, Specs, L, R>[],
) {
  return {
    has(specs: PolyhedronSpecs) {
      return ops.some(({ op, side }) => op.canApplyTo(side, specs))
    },
    get(specs: Specs) {
      const entry = ops.find(({ op, side }) => op.canApplyTo(side, specs))
      if (!entry) {
        throw new Error(`Could not apply any operations to ${specs.name}`)
      }
      return entry
    },
  }
}

/**
 * Convert the list of operation pairs to the necessary OpArgs to create an operation.
 * Assumes that each op pair works on a disjoint set of polyhedra
 */
function _toOpArgs<Specs extends PolyhedronSpecs, L, R, S extends Side>(
  opPairs: OpPairEntry<S, Specs, L, R>[],
): OpArgs<Opts<S, L, R>, Specs> {
  const combo = makeComboOp(opPairs)
  return {
    apply(solid, opts) {
      const { op, side } = combo.get(solid.specs)
      return op.apply(side, solid, opts)
    },
    canApplyTo(specs): specs is Specs {
      return combo.has(specs)
    },
    getResult(solid, opts) {
      const { op, side } = combo.get(solid.specs)
      return op.getOpposite(side, solid.specs, opts)
    },
    hasOptions(specs) {
      const { op, side } = combo.get(specs)
      return op.hasOptions(side, specs)
    },
  }
}

/**
 * Convert the list of operation pairs to the necessary OpArgs to create an operation.
 * Assumes that each op pair works on a disjoint set of polyhedra
 */
export function toOpArgs<Specs extends PolyhedronSpecs, L, R, S extends Side>(
  side: S,
  opPairs: OperationPair<Specs, L, R>[],
): OpArgs<Opts<S, L, R>, Specs> {
  return _toOpArgs(opPairs.map((op) => ({ op, side })))
}

/**
 * Create op args for the operation pair treating it as self-dual.
 */
export function selfDualOpArgs<Specs extends PolyhedronSpecs, Options>(
  op: OperationPair<Specs, Options, Options>,
): OpArgs<Options, Specs> {
  return _toOpArgs([
    { side: "left", op },
    { side: "right", op },
  ])
}
