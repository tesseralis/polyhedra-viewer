import { isEqual, isMatch } from "lodash-es"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron, VertexArg } from "math/polyhedra"
import { Vec3D, getOrthonormalTransform, withOrigin } from "math/geom"

type Side = "left" | "right"

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

interface OpPairInput<Specs extends PolyhedronSpecs, Opts> {
  // The graph of what polyhedron spec inputs are allowed and what maps to each other
  graph: OpPairGraph<Specs, Opts>
  // Get the intermediate polyhedron for the given graph entry
  getIntermediate(entry: GraphEntry<Specs, Opts>): Specs | SolidArgs<Specs>
  // Get the post of a left, right, or middle state
  getPose(pos: Side | "middle", solid: SolidArgs<Specs>, opts: Opts): Pose
  // Move the intermediate figure to the start position
  toLeft(solid: SolidArgs<Specs>, opts: Opts, result: Specs): VertexArg[]
  // Move the intermediate figure to the end position
  toRight(solid: SolidArgs<Specs>, opts: Opts, result: Specs): VertexArg[]
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

export default class OperationPair<
  Specs extends PolyhedronSpecs,
  Opts extends {} = {}
> {
  inputs: OpPairInput<Specs, Opts>
  constructor(inputs: OpPairInput<Specs, Opts>) {
    this.inputs = inputs
  }

  private findEntry(input: Side, specs: Specs, opts?: Opts) {
    return this.inputs.graph.find(
      (entry) =>
        specsEquals(entry[input], specs) &&
        isMatch(entry.options || {}, opts || {}),
    )
  }

  private getEntry(side: Side, specs: Specs, opts?: Opts) {
    const entry = this.findEntry(side, specs, opts)
    if (!entry)
      throw new Error(
        `Could not find ${side} entry with specs: ${specs}, opts: ${opts}`,
      )
    return entry
  }

  canApplyLeftTo(specs: PolyhedronSpecs) {
    return !!this.findEntry("left", specs as Specs)
  }

  canApplyRightTo(specs: PolyhedronSpecs) {
    return !!this.findEntry("right", specs as Specs)
  }

  getRight(source: Specs, options?: Opts) {
    return this.getEntry("left", source, options).right
  }

  getLeft(target: Specs, options?: Opts) {
    return this.getEntry("right", target, options).left
  }

  private doApply(side: Side, solid: SolidArgs<Specs>, opts: Opts) {
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

    const endSide = side === "left" ? "right" : "left"
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
          startFn(alignedMiddle, opts, solid.specs),
        ),
        endVertices: endFn(alignedMiddle, opts, endSpecs),
      },
      result: alignedEnd,
    }
  }

  applyLeft(args: SolidArgs<Specs>, options: Opts) {
    return this.doApply("left", args, options)
  }

  applyRight(args: SolidArgs<Specs>, options: Opts) {
    return this.doApply("right", args, options)
  }
}
