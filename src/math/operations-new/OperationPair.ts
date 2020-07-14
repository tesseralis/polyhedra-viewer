import { isMatch } from "lodash-es"
import { getAllSpecs } from "data/specs/getSpecs"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron, VertexArg } from "math/polyhedra"
import { Vec3D, getOrthonormalTransform, withOrigin } from "math/geom"

interface GraphEntry<Specs, Opts> {
  source: Specs
  target: Specs
  intermediate: Specs
  options?: Opts
}

// list of polyhedron pairs and their arguments
type OpPairGraph<Specs, Opts> = GraphEntry<Specs, Opts>[]

interface Pose {
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
  // Get the post of an input, output or intermediate solid
  getPose(solid: SolidArgs<Specs>, opts: Opts): Pose
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

export default class OperationPair<
  Specs extends PolyhedronSpecs,
  Opts extends {} = {}
> {
  inputs: OpPairInput<Specs, Opts>
  constructor(inputs: OpPairInput<Specs, Opts>) {
    this.inputs = inputs
  }

  private getSpecs(solid: Polyhedron, input: "source" | "target"): Specs {
    for (const specs of getAllSpecs(solid.name)) {
      if (
        this.inputs.graph.some((entry) => entry[input].name() === specs.name())
      ) {
        return specs as any
      }
    }
    throw new Error("could not find proper specs")
  }

  private entryFromSource(source: PolyhedronSpecs) {
    return this.inputs.graph.find(
      (entry) => entry.source.name() === source.name(),
    )
  }

  private entryFromTarget(target: PolyhedronSpecs) {
    return this.inputs.graph.find(
      (entry) => entry.target.name() === target.name(),
    )
  }

  canApplyTo(specs: PolyhedronSpecs) {
    return !!this.entryFromSource(specs)
  }

  canUnapplyTo(specs: PolyhedronSpecs) {
    return !!this.entryFromTarget(specs)
  }

  getResult(source: Specs) {
    return this.entryFromSource(source)!.target
  }

  getSource(target: Specs) {
    return this.entryFromTarget(target)!.source
  }

  doApply(solid: Polyhedron, input: "source" | "target", opts: Opts) {
    const { graph, getPose, toStart, toEnd } = this.inputs
    const specs = this.getSpecs(solid, input)
    const interSpecs = graph.find(
      (entry) =>
        entry[input].name() === specs.name() &&
        isMatch(entry.options || {}, opts),
    )!.intermediate

    const interSolid = Polyhedron.get(interSpecs.canonicalName())
    const alignedInter = alignPolyhedron(
      interSolid,
      getPose({ specs: interSpecs, geom: interSolid }, opts),
      getPose({ specs, geom: solid }, opts),
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
    }
  }

  apply(solid: Polyhedron, options: Opts) {
    return this.doApply(solid, "source", options)
  }

  unapply(solid: Polyhedron, options: Opts) {
    return this.doApply(solid, "target", options)
  }
}
