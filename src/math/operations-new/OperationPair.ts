import { isEqual, isMatch } from "lodash-es"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron, VertexArg } from "math/polyhedra"
import { Vec3D, getOrthonormalTransform, withOrigin } from "math/geom"

interface GraphEntry<Specs, Opts> {
  source: Specs
  target: Specs
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
  getIntermediate(entry: GraphEntry<Specs, Opts>): SolidArgs<Specs>
  // Get the post of an input, output or intermediate solid
  getPose(solid: SolidArgs<Specs>, opts: Opts): Pose
  getSourceGeom?(specs: Specs): Polyhedron
  getTargetGeom?(specs: Specs): Polyhedron
  // Move the intermediate figure to the start position
  toStart(solid: SolidArgs<Specs>, opts: Opts): VertexArg[]
  // Move the intermediate figure to the end position
  toEnd(solid: SolidArgs<Specs>, opts: Opts): VertexArg[]
}

// Transform the polyhedron with the transformation given by the two poses
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

export default class OperationPair<
  Specs extends PolyhedronSpecs,
  Opts extends {} = {}
> {
  inputs: OpPairInput<Specs, Opts>
  constructor(inputs: OpPairInput<Specs, Opts>) {
    this.inputs = inputs
  }

  private getEntry(specs: Specs, input: "source" | "target", opts?: Opts) {
    return this.inputs.graph.find(
      (entry) =>
        specsEquals(entry[input], specs) &&
        isMatch(entry.options || {}, opts || {}),
    )!
  }

  private entryFromSource(source: PolyhedronSpecs) {
    return this.inputs.graph.find((entry) => specsEquals(entry.source, source))
  }

  private entryFromTarget(target: PolyhedronSpecs) {
    return this.inputs.graph.find((entry) => specsEquals(entry.target, target))
  }

  canApplyTo(specs: PolyhedronSpecs) {
    return !!this.entryFromSource(specs)
  }

  canUnapplyTo(specs: PolyhedronSpecs) {
    return !!this.entryFromTarget(specs)
  }

  getResult(source: Specs, options?: Opts) {
    return this.getEntry(source, "source", options).target
  }

  getSource(target: Specs, options?: Opts) {
    return this.getEntry(target, "target", options).source
  }

  getGeom(specs: Specs, input: "source" | "target") {
    const fn = input === "source" ? "getSourceGeom" : ("getTargetGeom" as const)
    return this.inputs[fn]?.(specs) ?? Polyhedron.get(specs.canonicalName())
  }

  doApply(solid: SolidArgs<Specs>, input: "source" | "target", opts: Opts) {
    const { getPose, toStart, toEnd } = this.inputs
    const entry = this.getEntry(solid.specs, input, opts)
    const { specs: interSpecs, geom: interSolid } = this.inputs.getIntermediate(
      entry,
    )

    const output = input === "source" ? "target" : "source"
    const outputGeom = this.getGeom(entry[output], output)
    const inputPose = getPose(solid, opts)

    const alignedInter = alignPolyhedron(
      interSolid,
      getPose({ specs: interSpecs, geom: interSolid }, opts),
      inputPose,
    )

    const alignedOutput = alignPolyhedron(
      outputGeom,
      getPose({ specs: entry[output], geom: outputGeom }, opts),
      inputPose,
    )

    const [startFn, endFn] =
      input === "source" ? [toStart, toEnd] : [toEnd, toStart]

    return {
      animationData: {
        start: alignedInter.withVertices(
          startFn({ specs: interSpecs, geom: alignedInter }, opts),
        ),
        endVertices: endFn({ specs: interSpecs, geom: alignedInter }, opts),
      },
      result: alignedOutput,
    }
  }

  apply(args: SolidArgs<Specs>, options: Opts) {
    return this.doApply(args, "source", options)
  }

  unapply(args: SolidArgs<Specs>, options: Opts) {
    return this.doApply(args, "target", options)
  }
}
