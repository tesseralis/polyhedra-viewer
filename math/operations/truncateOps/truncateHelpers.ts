import Classical, { Operation as OpName } from "specs/Classical"
import { MorphDefinition, makeOpPair } from "../operationPairs"
import { Pose } from "../operationUtils"
import { ClassicalForme } from "math/formes"

interface TrioOpArgs<Op, Opts = any> {
  operation: Op
  transformer: MorphDefinition<Classical>
  options?(entry: Classical): Opts
}

interface TrioArgs<L, M, R> {
  left: TrioOpArgs<L>
  middle: Omit<TrioOpArgs<M>, "transformer">
  right: TrioOpArgs<R>
}

/**
 * Create a trio of truncation OpPairs: truncate, pare, and rectify.
 * Given the functions to use for operations, poses, and transformers,
 * generate the triplet of OpPairs to use.
 */
export function makeTruncateTrio<
  L extends OpName,
  M extends OpName,
  R extends OpName
>(
  getPose: (forme: ClassicalForme, options: any) => Pose,
  args: TrioArgs<L, M, R>,
) {
  const { left, right, middle } = args
  function makePair(leftOp: "left" | "middle", rightOp: "middle" | "right") {
    // Choose which side is the "middle" in order to short-circuit getting the intermediate
    const middleArg =
      leftOp === "middle" ? "left" : rightOp === "middle" ? "right" : null

    return makeOpPair({
      graph: function* () {
        for (const entry of Classical.allWithOperation(middle.operation)) {
          yield {
            left: entry.withOperation(args[leftOp].operation),
            right: entry.withOperation(args[rightOp].operation),
            options: {
              left: args[leftOp].options?.(entry),
              right: args[rightOp].options?.(entry),
            },
          }
        }
      },
      // If this is the left-right operation, then the intermediate
      // is going to be the middle operation
      intermediate:
        middleArg ??
        ((entry) => (entry.left as any).withOperation(middle.operation)),
      getPose,
      toLeft: leftOp === "left" ? left.transformer : undefined,
      toRight: rightOp === "right" ? right.transformer : undefined,
    })
  }

  return {
    truncate: makePair("left", "middle"),
    pare: makePair("middle", "right"),
    rectify: makePair("left", "right"),
  }
}
