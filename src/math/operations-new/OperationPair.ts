import { getAllSpecs } from "data/specs/getSpecs"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"
import { Polyhedron } from "math/polyhedra"
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
  getPose(solid: SolidArgs<Specs>): Pose
  // Move the intermediate figure to the start position
  toStart(solid: SolidArgs<Specs>): Polyhedron
  // Move the intermediate figure to the end position
  toEnd(solid: SolidArgs<Specs>): Polyhedron
}

// Transform the polyhedron with the transformation given by the two poses
function alignPolyhedron(solid: Polyhedron, pose1: Pose, pose2: Pose) {
  // FIXME scale correctly
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

export default class OperationPair<Specs extends PolyhedronSpecs, Opts> {
  inputs: OpPairInput<Specs, Opts>
  constructor(inputs: OpPairInput<Specs, Opts>) {
    this.inputs = inputs
  }

  private getSpecs(solid: Polyhedron): Specs {
    for (const specs of getAllSpecs(solid.name)) {
      if (this.canApplyTo(specs)) {
        return specs
      }
    }
    throw new Error("could not find proper specs")
  }

  canApplyTo(specs: PolyhedronSpecs): specs is Specs {
    // TODO do specs have identity?
    return this.inputs.graph.some(
      (entry) => entry.source.name() === specs.name(),
    )
  }

  canUnapplyTo(solid: Polyhedron) {
    const specs = this.getSpecs(solid)
    return this.inputs.graph.some(
      (entry) => entry.target.name() === specs.name(),
    )
  }

  getResult(source: Specs) {
    return this.inputs.graph.find((x) => x.source.name() === source.name())!
      .target
  }

  apply(solid: Polyhedron) {
    const { graph, getPose, toStart, toEnd } = this.inputs
    const startSpecs = this.getSpecs(solid)
    const interSpecs = graph.find((x) => x.source.name() === startSpecs.name())!
      .intermediate
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
  }
}
