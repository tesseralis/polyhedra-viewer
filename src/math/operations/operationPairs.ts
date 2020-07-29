import { isMatch } from "lodash-es"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { VertexArg } from "math/polyhedra"
import { OpArgs, SolidArgs } from "./Operation"
import { Pose, alignPolyhedron, getGeometry } from "./operationUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"
import createForme from "math/formes/createForme"

export type Side = "left" | "right"

function oppositeSide(side: Side) {
  return side === "left" ? "right" : "left"
}

interface GraphOpts<L, R> {
  left: L
  right: R
}

// TODO ugh this is still ugly
interface GraphEntry<Specs, L, R> {
  left: Specs
  right: Specs
  options?: GraphOpts<L, R>
}

// list of polyhedron pairs and their arguments
type OpPairGraph<Specs, L, R> = GraphEntry<Specs, L, R>[]

type MiddleGetter<
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>,
  L,
  R
> = (entry: GraphEntry<Specs, L, R>) => Specs | Forme

interface OpPairInput<
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>,
  L = {},
  R = L
> {
  // The graph of what polyhedron spec inputs are allowed and what maps to each other
  graph: OpPairGraph<Specs, L, R>
  // Get the intermediate polyhedron for the given graph entry
  middle: Side | MiddleGetter<Specs, Forme, L, R>
  // Get the post of a left, right, or middle state
  getPose(pos: Side | "middle", solid: Forme, opts: GraphOpts<L, R>): Pose
  // Move the intermediate figure to the left position
  toLeft?(solid: Forme, opts: GraphOpts<L, R>, result: Specs): VertexArg[]
  // Move the intermediate figure to the right position
  toRight?(solid: Forme, opts: GraphOpts<L, R>, result: Specs): VertexArg[]
}

function defaultGetter<Specs extends PolyhedronSpecs>({
  geom,
}: SolidArgs<Specs>) {
  return geom.vertices
}

type Opts<S extends Side, L, R> = S extends "left" ? L : R

class OpPair<
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>,
  L extends {} = {},
  R extends {} = L
> {
  inputs: OpPairInput<Specs, Forme, L, R>
  constructor(inputs: OpPairInput<Specs, Forme, L, R>) {
    this.inputs = inputs
  }

  private getEntries(side: Side, specs: Specs) {
    return this.inputs.graph.filter((entry) => entry[side].equals(specs))
  }

  findEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    return this.inputs.graph.find(
      (entry) =>
        entry[side].equals(specs) &&
        isMatch(entry.options?.[side] ?? {}, opts ?? {}),
    )
  }

  getEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    const entry = this.findEntry(side, specs, opts)
    if (!entry)
      throw new Error(
        `Could not find ${side} entry with specs: ${specs.name()}, opts: ${JSON.stringify(
          opts,
        )}`,
      )
    return entry
  }

  hasOptions(side: Side, specs: Specs) {
    return this.getEntries(side, specs).length > 1
  }

  *allOptions<S extends Side>(side: S, specs: Specs): Generator<Opts<S, L, R>> {
    for (const entry of this.getEntries(side, specs)) {
      yield (entry.options?.[side] ?? {}) as Opts<S, L, R>
    }
  }

  canApplyTo(side: Side, specs: PolyhedronSpecs) {
    return !!this.findEntry(side, specs as Specs)
  }

  getOpposite<S extends Side>(side: S, specs: Specs, options?: Opts<S, L, R>) {
    return this.getEntry(side, specs, options)[oppositeSide(side)]
  }

  apply<S extends Side>(side: S, solid: SolidArgs<Specs>, opts: Opts<S, L, R>) {
    const {
      middle: getMiddle,
      getPose,
      toLeft = defaultGetter,
      toRight = defaultGetter,
    } = this.inputs
    const entry = this.getEntry(side, solid.specs, opts)
    const options =
      entry.options ?? ({ left: {}, right: {} } as GraphOpts<L, R>)
    const solidForme = createForme(solid.specs, solid.geom) as Forme
    const startPose = getPose(side, solidForme, options)

    const endSide = oppositeSide(side)
    const endSpecs = entry[endSide]
    const endGeom = getGeometry(endSpecs)
    const alignedEnd = alignPolyhedron(
      endGeom,
      getPose(endSide, createForme(endSpecs, endGeom) as Forme, options),
      startPose,
    )

    let middle
    if (typeof getMiddle === "string") {
      // If we receive a Side argument, set the middle to whichever end polyhedron
      // matches the side
      middle =
        getMiddle === side
          ? solidForme
          : (createForme(endSpecs, alignedEnd) as Forme)
    } else {
      // Otherwise, we have to fetch the intermediate solid ourselves
      // const middleSolid = normalizeIntermediate(getMiddle(entry))
      const inter = getMiddle(entry)
      const middleSolid =
        inter instanceof PolyhedronSpecs
          ? (createForme(inter, getGeometry(inter)) as Forme)
          : inter

      const alignedInter = alignPolyhedron(
        middleSolid.geom,
        getPose("middle", middleSolid, options),
        startPose,
      )
      middle = createForme(middleSolid.specs, alignedInter) as Forme
    }

    const [startFn, endFn] =
      side === "left" ? [toLeft, toRight] : [toRight, toLeft]

    return {
      animationData: {
        start: middle.geom.withVertices(startFn(middle, options, solid.specs)),
        endVertices: endFn(middle, options, endSpecs),
      },
      result: alignedEnd,
    }
  }
}

type OpInput<
  O,
  S extends PolyhedronSpecs,
  F extends PolyhedronForme<S>
> = Required<
  Pick<
    OpArgs<O, S, F>,
    "apply" | "canApplyTo" | "allOptionCombos" | "getResult" | "hasOptions"
  >
>

/**
 * Turn an operation pair into the one-way operation corresponding to the given side
 */
function makeOperation<
  S extends Side,
  Sp extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Sp>,
  L,
  R
>(side: S, op: OpPair<Sp, Forme, L, R>): OpInput<Opts<S, L, R>, Sp, Forme> {
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
      yield* op.allOptions(side, specs)
    },
  }
}

/**
 * Takes the given input and creates a pair of inverse operations.
 */
export function makeOpPair<
  Specs extends PolyhedronSpecs,
  Forme extends PolyhedronForme<Specs>,
  L = {},
  R = L
>(opInput: OpPairInput<Specs, Forme, L, R>) {
  const op = new OpPair(opInput)
  return { left: makeOperation("left", op), right: makeOperation("right", op) }
}

export function combineOps<
  S extends PolyhedronSpecs,
  F extends PolyhedronForme<S>,
  O
>(opArgs: OpInput<O, S, F>[]): OpInput<O, S, F> {
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
      yield* getOp(solid.specs).allOptionCombos(solid)
    },
  }
}
