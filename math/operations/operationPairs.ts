import { isMatch, pickBy } from "lodash-es"
import { PolyhedronSpecs } from "specs"
import { VertexArg } from "math/polyhedra"
import {
  OpArgs,
  SolidArgs,
  GraphEntry as DirectedGraphEntry,
} from "./Operation"
import { Pose, alignPolyhedron, getGeometry } from "./operationUtils"
import BaseForme from "math/formes/BaseForme"
import { PolyhedronForme as Forme, createForme } from "math/formes"

/**
 * Defines a pair of inverse operations based on the given parameters.
 * An operation pair is defined as a bijective mapping from the left entries to the right entries.
 */
export interface OpPairInput<Specs extends PolyhedronSpecs, L = {}, R = L> {
  /**
   * The graph defining which polyhedral formes map onto each other when applying the operation
   * or its inverse and under which options it does so.
   */
  graph(): GraphGenerator<Specs, L, R>
  /**
   * Defines the intermediate forme to interpolate to the left or right positions.
   * If "left" or "right" is given, then the intermediate forme is set to the forme of that side.
   * If instead a function is defined that returns Specs or a Forme, that forme (or the forme corresponding
   * to that Specs) is used.
   */
  intermediate: Side | IntermediateGetter<Specs, L, R>
  /**
   * Defines how to align the solid for the purposes of interpolating the intermediate forme into
   * the left and right formes.
   */
  getPose(solid: Forme<Specs>, opts: GraphOpts<L, R>): Pose
  /**
   * Define how to interpolate the intermediate forme into the left forme.
   * If undefined, the intermediate is assumed to be identical to the left forme.
   */
  toLeft?(
    start: Forme<Specs>,
    end: Forme<Specs>,
    opts: GraphOpts<L, R>,
  ): VertexArg[]
  /**
   * Define how to interpolate the intermediate forme into the right forme.
   * If undefined, the intermediate is assumed to be identical to the right forme.
   */
  toRight?(
    start: Forme<Specs>,
    end: Forme<Specs>,
    opts: GraphOpts<L, R>,
  ): VertexArg[]
}

export type GraphGenerator<Specs, L, R> = Generator<GraphEntry<Specs, L, R>>

export interface GraphEntry<Specs, L, R> {
  left: Specs
  right: Specs
  options?: GraphOpts<L, R>
}

export interface GraphOpts<L, R> {
  left: L
  right: R
}

type Opts<S extends Side, L, R> = S extends "left" ? L : R

export type Side = "left" | "right"

type IntermediateGetter<S extends PolyhedronSpecs, L, R> = (
  entry: GraphEntry<S, L, R>,
) => S | Forme<S>

/**
 * Create an operation pair from the provided input parameters.
 */
export function makeOpPair<Specs extends PolyhedronSpecs, L = {}, R = L>(
  opInput: OpPairInput<Specs, L, R>,
) {
  const op = new OpPair(opInput)
  return { left: makeOperation("left", op), right: makeOperation("right", op) }
}

class OpPair<
  Specs extends PolyhedronSpecs,
  L extends {} = {},
  R extends {} = L
> {
  inputs: OpPairInput<Specs, L, R>
  graph: GraphEntry<Specs, L, R>[]

  constructor(inputs: OpPairInput<Specs, L, R>) {
    this.inputs = inputs
    this.graph = [...this.inputs.graph()]
  }

  // Return the graph entries for the given side that match the given Specs
  private getEntries(side: Side, specs: Specs) {
    return this.graph.filter((entry) => entry[side].equals(specs))
  }

  findEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    return this.graph.find(
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

  apply<S extends Side>(side: S, start: Forme<Specs>, opts: Opts<S, L, R>) {
    const {
      intermediate: getIntermediate,
      getPose,
      toLeft = defaultGetter,
      toRight = defaultGetter,
    } = this.inputs

    const specs = start.specs as Specs
    const entry = this.getEntry(side, specs, opts)
    const options =
      entry.options ?? ({ left: {}, right: {} } as GraphOpts<L, R>)
    const startPose = getPose(start, options)

    // Get the aligned version of the end forme
    const endSpecs = entry[oppositeSide(side)]
    const endGeom = getGeometry(endSpecs)
    const alignedEndGeom = alignPolyhedron(
      endGeom,
      // TODO make an ".align()" method on Formes to simplify this
      getPose(createForme(endSpecs, endGeom), options),
      startPose,
    )
    const end = createForme(endSpecs, alignedEndGeom)

    let intermediate: Forme<Specs>
    if (typeof getIntermediate === "string") {
      // If we receive either "left" or "right"
      // set the intermediate to the corresponding forme
      intermediate = getIntermediate === side ? start : end
    } else {
      // Otherwise, we have to fetch the intermediate solid ourselves
      const inter = getIntermediate(entry)
      // TODO figure out a way to get this without importing the base constructor?
      const middleSolid =
        inter instanceof BaseForme
          ? inter
          : createForme(inter, getGeometry(inter))

      const alignedInter = alignPolyhedron(
        middleSolid.geom,
        getPose(middleSolid, options),
        startPose,
      )
      intermediate = createForme(middleSolid.specs as Specs, alignedInter)
    }

    // Disambiguate the interpolators to the start and end based on direction
    const [toStart, toEnd] =
      side === "left" ? [toLeft, toRight] : [toRight, toLeft]

    return {
      result: end,
      animationData: {
        start: intermediate.geom.withVertices(
          toStart(intermediate, start, options),
        ),
        endVertices: toEnd(intermediate, end, options),
      },
    }
  }
}

export type OpInput<O, S extends PolyhedronSpecs, GO = O> = Required<
  Pick<OpArgs<O, S, GO>, "apply" | "graph" | "toGraphOpts">
>

/**
 * Turn an operation pair into the one-way operation corresponding to the given side
 */
function makeOperation<S extends Side, Specs extends PolyhedronSpecs, L, R>(
  side: S,
  op: OpPair<Specs, L, R>,
): OpInput<Opts<S, L, R>, Specs> {
  return {
    apply(solid, opts) {
      return op.apply(side, solid, opts)
    },
    graph: toDirected(side, op.inputs.graph),
    toGraphOpts(forme, opts) {
      return opts
    },
  }
}

export function combineOps<O, GO extends {} = O>(
  opArgs: OpInput<O, PolyhedronSpecs, GO>[],
): OpInput<O, PolyhedronSpecs, GO> {
  interface CallbackArg {
    op: OpInput<O, PolyhedronSpecs, GO>
    forme: Forme<PolyhedronSpecs>
    graphOpts: GO
  }

  function doWithRightForme<R>(
    solid: Forme<PolyhedronSpecs>,
    opts: O,
    callback: (args: CallbackArg) => R,
  ) {
    for (const op of opArgs) {
      // Finagle with the arguments to get the correctly (un)wrapped
      // version of the forme
      for (const { start, options = {} } of op.graph()) {
        if (!start.equivalent(solid.specs)) {
          continue
        }
        const forme = createForme(start, solid.geom)
        const graphOpts = op.toGraphOpts(forme, opts)
        if (isMatch(options, pickBy(graphOpts))) {
          return callback({ op, forme, graphOpts })
        }
      }
    }
    throw new Error(
      `Could not find matching graph entry for ${
        solid.specs.type
      } ${solid.specs.name()}`,
    )
  }
  return {
    graph: function* () {
      for (const op of opArgs) {
        yield* op.graph()
      }
    },
    apply(solid, opts) {
      return doWithRightForme(solid, opts, ({ op, forme }) =>
        op.apply(forme, opts),
      )
    },
    toGraphOpts(solid, opts) {
      return doWithRightForme(solid, opts, ({ graphOpts }) => graphOpts)
    },
  }
}

// Convert the graph generator into a directed graph (either left-to-right or right-to-left)
export function toDirected<S extends Side, Specs, L, R>(
  side: S,
  graph: () => Generator<GraphEntry<Specs, L, R>>,
): () => Generator<DirectedGraphEntry<Specs, Opts<S, L, R>>> {
  return function* () {
    for (const entry of graph()) {
      yield {
        start: entry[side],
        end: entry[oppositeSide(side)],
        options: entry.options?.[side] as any,
      }
    }
  }
}

function defaultGetter<Specs extends PolyhedronSpecs>({
  geom,
}: SolidArgs<Specs>) {
  return geom.vertices
}

function oppositeSide(side: Side) {
  return side === "left" ? "right" : "left"
}
