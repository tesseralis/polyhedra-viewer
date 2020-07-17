import { isEqual, isMatch } from "lodash-es"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron, VertexArg } from "math/polyhedra"
import { Vec3D, getOrthonormalTransform, withOrigin } from "math/geom"

export type Side = "left" | "right"

function oppositeSide(side: Side) {
  return side === "left" ? "right" : "left"
}

interface GraphEntry<Specs, Opts> {
  left: Specs
  right: Specs
  options?: Opts
}

// list of polyhedron pairs and their arguments
type OpPairGraph<Specs, Opts> = GraphEntry<Specs, Opts>[]

export interface Pose {
  scale: number
  origin: Vec3D
  orientation: readonly [Vec3D, Vec3D]
}

interface SolidArgs<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron
}

interface OpPairInput<
  Specs extends PolyhedronSpecs,
  LeftOpts = {},
  RightOpts = LeftOpts
> {
  // The graph of what polyhedron spec inputs are allowed and what maps to each other
  graph: OpPairGraph<Specs, LeftOpts & RightOpts>
  // Get the intermediate polyhedron for the given graph entry
  getIntermediate(
    entry: GraphEntry<Specs, LeftOpts & RightOpts>,
  ): Specs | SolidArgs<Specs>
  // Get the post of a left, right, or middle state
  getPose(
    pos: Side | "middle",
    solid: SolidArgs<Specs>,
    opts: LeftOpts & RightOpts,
  ): Pose
  // Move the intermediate figure to the start position
  toLeft(
    solid: SolidArgs<Specs>,
    opts: LeftOpts & RightOpts,
    result: Specs,
  ): VertexArg[]
  // Move the intermediate figure to the end position
  toRight(
    solid: SolidArgs<Specs>,
    opts: LeftOpts & RightOpts,
    result: Specs,
  ): VertexArg[]
}

function normalizeIntermediate<Specs extends PolyhedronSpecs>(
  inter: Specs | SolidArgs<Specs>,
) {
  if (inter instanceof PolyhedronSpecs) {
    return { specs: inter, geom: getGeom(inter) }
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

function specsEquals(spec1: PolyhedronSpecs, spec2: PolyhedronSpecs) {
  return isEqual(spec1.data, spec2.data)
}

export function getGeom(specs: PolyhedronSpecs) {
  const geom = Polyhedron.get(specs.canonicalName())
  // The reference models are always right-handed,
  // so flip 'em if not
  // TODO don't rely on this and make it more general
  if (specs.isClassical() && specs.isSnub() && specs.data.twist === "left") {
    return geom.reflect()
  }
  return geom
}

export type Opts<S extends Side, LeftOpts, RightOpts> = S extends "left"
  ? LeftOpts
  : RightOpts

export default class OperationPair<
  Specs extends PolyhedronSpecs,
  L extends {} = {},
  R extends {} = L
> {
  inputs: OpPairInput<Specs, L, R>
  constructor(inputs: OpPairInput<Specs, L, R>) {
    this.inputs = inputs
  }

  private findEntry(input: Side, specs: Specs, opts?: Opts<Side, L, R>) {
    return this.inputs.graph.find(
      (entry) =>
        specsEquals(entry[input], specs) &&
        isMatch(entry.options || {}, opts || {}),
    )
  }

  private getEntry(side: Side, specs: Specs, opts?: Opts<Side, L, R>) {
    const entry = this.findEntry(side, specs, opts)
    if (!entry)
      throw new Error(
        `Could not find ${side} entry with specs: ${specs}, opts: ${opts}`,
      )
    return entry
  }

  canApplyTo(side: Side, specs: PolyhedronSpecs) {
    return !!this.findEntry(side, specs as Specs)
  }

  canApplyLeftTo(specs: PolyhedronSpecs) {
    return this.canApplyTo("left", specs)
  }

  canApplyRightTo(specs: PolyhedronSpecs) {
    return this.canApplyTo("right", specs)
  }

  getOpposite(side: Side, specs: Specs, options?: Opts<Side, L, R>) {
    return this.getEntry(side, specs, options)[oppositeSide(side)]
  }

  getRight(left: Specs, options?: L) {
    return this.getOpposite("left", left, options)
  }

  getLeft(right: Specs, options?: R) {
    return this.getOpposite("right", right, options)
  }

  apply(side: Side, solid: SolidArgs<Specs>, opts: Opts<Side, L, R>) {
    const { getPose, toLeft, toRight } = this.inputs
    const entry = this.getEntry(side, solid.specs, opts)
    const middle = normalizeIntermediate(this.inputs.getIntermediate(entry))
    const options = entry.options!

    const startPose = getPose(side, solid, options)

    const alignedInter = alignPolyhedron(
      middle.geom,
      getPose("middle", middle, options),
      startPose,
    )
    const alignedMiddle = { ...middle, geom: alignedInter }

    const endSide = oppositeSide(side)
    const endSpecs = entry[endSide]
    const endGeom = getGeom(endSpecs)
    const alignedEnd = alignPolyhedron(
      endGeom,
      getPose(endSide, { specs: endSpecs, geom: endGeom }, options),
      startPose,
    )

    const [startFn, endFn] =
      side === "left" ? [toLeft, toRight] : [toRight, toLeft]

    return {
      animationData: {
        start: alignedInter.withVertices(
          startFn(alignedMiddle, options, solid.specs),
        ),
        endVertices: endFn(alignedMiddle, options, endSpecs),
      },
      result: alignedEnd,
    }
  }

  applyLeft(args: SolidArgs<Specs>, options: L) {
    return this.apply("left", args, options)
  }

  applyRight(args: SolidArgs<Specs>, options: R) {
    return this.apply("right", args, options)
  }
}
