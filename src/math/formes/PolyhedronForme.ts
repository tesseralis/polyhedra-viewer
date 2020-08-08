import { mean } from "lodash-es"
import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

import type ClassicalForme from "./ClassicalForme"
import type CapstoneForme from "./CapstoneForme"
import type CompositeForme from "./CompositeForme"
import { Vector3 } from "three"
import { Pose, alignPolyhedron } from "math/operations/operationUtils"

export default class PolyhedronForme<
  Specs extends PolyhedronSpecs = PolyhedronSpecs
> {
  specs: Specs
  geom: Polyhedron

  constructor(specs: Specs, geom: Polyhedron) {
    this.specs = specs
    this.geom = geom
  }

  isClassical(): this is ClassicalForme {
    return this.specs.isClassical()
  }

  isCapstone(): this is CapstoneForme {
    return this.specs.isCapstone()
  }

  isComposite(): this is CompositeForme {
    return this.specs.isComposite()
  }

  orientation(): readonly [Vector3, Vector3] {
    return [this.geom.vertices[0].vec, this.geom.vertices[1].vec]
  }

  orient() {
    const startPose: Pose = {
      // TODO correctly center diminished polyhedra
      origin: this.geom.centroid(),
      scale: mean(this.geom.edges.map((e) => e.distanceToCenter())),
      orientation: this.orientation(),
    }

    const endPose: Pose = {
      origin: new Vector3(),
      scale: 1,
      orientation: [new Vector3(0, 1, 0), new Vector3(1, 0, 0)],
    }
    return alignPolyhedron(this.geom, startPose, endPose)
  }
}
