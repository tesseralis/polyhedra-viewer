import OperationPair, {
  OpPairInput,
  Side,
  Opts,
} from "../operations-new/OperationPair"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { OpArgs } from "./Operation"

type OpInput<O, S extends PolyhedronSpecs> = Required<
  Pick<
    OpArgs<O, S>,
    "apply" | "canApplyTo" | "allOptionCombos" | "getResult" | "hasOptions"
  >
>

export function makeOperation<S extends Side, Sp extends PolyhedronSpecs, L, R>(
  side: S,
  op: OperationPair<Sp, L, R>,
): OpInput<Opts<S, L, R>, Sp> {
  return {
    apply(solid, opts) {
      return op.apply(side, solid, opts)
    },
    canApplyTo(specs) {
      return op.canApplyTo(side, specs)
    },
    getResult(solid, opts) {
      return op.getOpposite(side, solid.specs, opts)
    },
    hasOptions(specs) {
      return op.hasOptions(side, specs)
    },
    *allOptionCombos({ specs }) {
      yield* op.allOptions(side, specs) as any
    },
  }
}

export function makeOpPair<Specs extends PolyhedronSpecs, L = {}, R = L>(
  opInput: OpPairInput<Specs, L, R>,
) {
  const op = new OperationPair(opInput)
  return { left: makeOperation("left", op), right: makeOperation("right", op) }
}

export function combineOps<S extends PolyhedronSpecs, O>(
  opArgs: OpInput<O, S>[],
): OpInput<O, S> {
  function canApplyTo(specs: S) {
    return opArgs.some((op) => op.canApplyTo(specs))
  }

  function getOp(specs: S) {
    const entry = opArgs.find((op) => op.canApplyTo(specs))
    if (!entry) {
      throw new Error(`Could not apply any operations to ${specs.name}`)
    }
    return entry
  }

  return {
    canApplyTo,
    apply(solid, opts) {
      return getOp(solid.specs).apply(solid, opts)
    },
    getResult(solid, opts) {
      return getOp(solid.specs).getResult(solid, opts)
    },
    hasOptions(specs) {
      return getOp(specs).hasOptions(specs) ?? false
    },
    *allOptionCombos(solid) {
      yield* getOp(solid.specs).allOptionCombos(solid) as any
    },
  }
}
