import { Polyhedron } from "math/polyhedra"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Vec3D } from "math/geom"
import { toNamespacedPath } from "path"

interface GraphEntry<Specs, Opts> {
  source: Specs
  target: Specs
  intermediate: Specs
  options?: Opts
}

// list of polyhedron pairs and their arguments
type OpPairGraph<Specs, Opts> = GraphEntry<Specs, Opts>[]

interface Pose {
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
  getPose(solid: SolidArgs<Specs>): Pose
  // Move the intermediate figure to the start position
  toStart(solid: SolidArgs<Specs>): Polyhedron
  // Move the intermediate figure to the end position
  toEnd(solid: SolidArgs<Specs>): Polyhedron
}

// Transform the polyhedron with the transformation given by the two poses
function alignPolyhedron(solid: Polyhedron, pose1: Pose, pose2: Pose) {
  return solid
}

export default class OperationPair<Specs extends PolyhedronSpecs, Opts> {
  inputs: OpPairInput<Specs, Opts>
  constructor(inputs: OpPairInput<Specs, Opts>) {
    this.inputs = inputs
  }

  // canApply() checks the entries of the graph
  // hasOptions() (by default)
  private getSpecs(solid: Polyhedron): Specs {
    // FIXME we need to implement our own version of "getPreferredSpec"
    throw new Error("not implemented")
  }

  // Get the target given the polyhedron
  private getTarget(specs: Specs) {
    return this.inputs.graph.find((input) => input.source === specs)!.target
  }

  canApply(solid: Polyhedron) {
    const specs = this.getSpecs(solid)
    // TODO do specs have identity?
    return this.inputs.graph.some((entry) => entry.source === specs)
  }

  canUnapply(solid: Polyhedron) {
    const specs = this.getSpecs(solid)
    return this.inputs.graph.some((entry) => entry.target === specs)
  }

  apply(solid: Polyhedron) {
    const { graph, getPose, toStart, toEnd } = this.inputs
    const startSpecs = this.getSpecs(solid)
    const interSpecs = graph.find((x) => x.source === startSpecs)!.intermediate
    const interSolid = Polyhedron.get(interSpecs.canonicalName())
    const alignedInter = alignPolyhedron(
      interSolid,
      getPose({ specs: interSpecs, geom: interSolid }),
      getPose({ specs: startSpecs, geom: solid }),
    )
    return {
      animationData: {
        start: toStart({ specs: interSpecs, geom: alignedInter }),
        endVertices: toEnd({ specs: interSpecs, geom: alignedInter }).vertices,
      },
    }
    // const target = this.getTarget(specs)
    // const targetSolid = Polyhedron.get(target.canonicalName())
    // get the intermediate

    // align the intermediate to the solid and assign that to animationData.start
    //

    return {}
  }
}
