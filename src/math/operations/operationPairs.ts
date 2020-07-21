import { isEqual, isMatch } from "lodash-es"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron, VertexArg } from "math/polyhedra"
import { Vec3D, getOrthonormalTransform, withOrigin } from "math/geom"
import { OpArgs, SolidArgs } from "./Operation"
import { getGeometry } from "./operationUtils"

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

export interface Pose {
  scale: number
  origin: Vec3D
  orientation: readonly [Vec3D, Vec3D]
}

type MiddleGetter<Specs extends PolyhedronSpecs, L, R> = (
  entry: GraphEntry<Specs, L, R>,
) => Specs | SolidArgs<Specs>

interface OpPairInput<Specs extends PolyhedronSpecs, L = {}, R = L> {
  // The graph of what polyhedron spec inputs are allowed and what maps to each other
  graph: OpPairGraph<Specs, L, R>
  // Get the intermediate polyhedron for the given graph entry
  middle: Side | MiddleGetter<Specs, L, R>
  // Get the post of a left, right, or middle state
  getPose(
    pos: Side | "middle",
    solid: SolidArgs<Specs>,
    opts: GraphOpts<L, R>,
  ): Pose
  // Move the intermediate figure to the left position
  toLeft?(
    solid: SolidArgs<Specs>,
    opts: GraphOpts<L, R>,
    result: Specs,
  ): VertexArg[]
  // Move the intermediate figure to the right position
  toRight?(
    solid: SolidArgs<Specs>,
    opts: GraphOpts<L, R>,
    result: Specs,
  ): VertexArg[]
}

function normalizeIntermediate<Specs extends PolyhedronSpecs>(
  inter: Specs | SolidArgs<Specs>,
) {
  if (inter instanceof PolyhedronSpecs) {
    return { specs: inter, geom: getGeometry(inter) }
  }
  return inter
}

// Translate, rotate, and scale the polyhedron with the transformation given by the two poses
function alignPolyhedron(solid: Polyhedron, pose1: Pose, pose2: Pose) {
  const [u1, u2] = pose1.orientation.map((x) => x.getNormalized())
  const [v1, v2] = pose2.orientation.map((x) => x.getNormalized())
  const matrix = getOrthonormalTransform(u1, u2, v1, v2)
  const rotate = withOrigin(pose2.origin, (u) => matrix.applyTo(u))
  const newVertices = solid.vertices.map((v) =>
    rotate(
      v.vec
        .sub(pose1.origin)
        .scale(pose2.scale / pose1.scale)
        .add(pose2.origin),
    ),
  )
  return solid.withVertices(newVertices)
}

function specsEquals(spec1: PolyhedronSpecs, spec2: PolyhedronSpecs): boolean {
  if (spec1.isComposite() && spec2.isComposite()) {
    const { source: source1, ...data1 } = spec1.data
    const { source: source2, ...data2 } = spec2.data
    return specsEquals(source1, source2) && isEqual(data1, data2)
  }
  return isEqual(spec1.data, spec2.data)
}

function defaultGetter<Specs extends PolyhedronSpecs>({
  geom,
}: SolidArgs<Specs>) {
  return geom.vertices
}

type Opts<S extends Side, L, R> = S extends "left" ? L : R

class OpPair<
  Specs extends PolyhedronSpecs,
  L extends {} = {},
  R extends {} = L
> {
  inputs: OpPairInput<Specs, L, R>
  constructor(inputs: OpPairInput<Specs, L, R>) {
    this.inputs = inputs
  }

  private getEntries(side: Side, specs: Specs) {
    return this.inputs.graph.filter((entry) => specsEquals(entry[side], specs))
  }

  findEntry<S extends Side>(side: S, specs: Specs, opts?: Opts<S, L, R>) {
    return this.inputs.graph.find(
      (entry) =>
        specsEquals(entry[side], specs) &&
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
    const startPose = getPose(side, solid, options)

    const endSide = oppositeSide(side)
    const endSpecs = entry[endSide]
    const endGeom = getGeometry(endSpecs)
    const alignedEnd = alignPolyhedron(
      endGeom,
      getPose(endSide, { specs: endSpecs, geom: endGeom }, options),
      startPose,
    )

    let middle
    if (typeof getMiddle === "string") {
      // If we receive a Side argument, set the middle to whichever end polyhedron
      // matches the side
      middle =
        getMiddle === side ? solid : { specs: endSpecs, geom: alignedEnd }
    } else {
      // Otherwise, we have to fetch the intermediate solid ourselves
      const middleSolid = normalizeIntermediate(getMiddle(entry))
      const alignedInter = alignPolyhedron(
        middleSolid.geom,
        getPose("middle", middleSolid, options),
        startPose,
      )
      middle = { ...middleSolid, geom: alignedInter }
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

type OpInput<O, S extends PolyhedronSpecs> = Required<
  Pick<
    OpArgs<O, S>,
    "apply" | "canApplyTo" | "allOptionCombos" | "getResult" | "hasOptions"
  >
>

/**
 * Turn an operation pair into the one-way operation corresponding to the given side
 */
function makeOperation<S extends Side, Sp extends PolyhedronSpecs, L, R>(
  side: S,
  op: OpPair<Sp, L, R>,
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
      yield* op.allOptions(side, specs)
    },
  }
}

/**
 * Takes the given input and creates a pair of inverse operations.
 */
export function makeOpPair<Specs extends PolyhedronSpecs, L = {}, R = L>(
  opInput: OpPairInput<Specs, L, R>,
) {
  const op = new OpPair(opInput)
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
      yield* getOp(solid.specs).allOptionCombos(solid)
    },
  }
}
