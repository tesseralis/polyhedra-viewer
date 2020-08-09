import { mean } from "lodash-es"
import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

import { Classical, Capstone, Composite, Elementary } from "specs"
import type ClassicalForme from "./ClassicalForme"
import type CapstoneForme from "./CapstoneForme"
import type CompositeForme from "./CompositeForme"
import type ElementaryForme from "./ElementaryForme"
import { Vector3 } from "three"
import {
  Orientation,
  Pose,
  alignPolyhedron,
} from "math/operations/operationUtils"

export type PolyhedronForme<
  S extends PolyhedronSpecs = PolyhedronSpecs
> = S extends Classical
  ? ClassicalForme
  : S extends Capstone
  ? CapstoneForme
  : S extends Composite
  ? CompositeForme
  : S extends Elementary
  ? ElementaryForme
  : never

export default class BaseForme<Specs extends PolyhedronSpecs> {
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

  isElementary(): this is ElementaryForme {
    return this.specs.isElementary()
  }

  orientation(): Orientation {
    return [this.geom.vertices[0], this.geom.vertices[1]]
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
      orientation: [new Vector3(0, 1, 0), new Vector3(0, 0, 1)],
    }
    return alignPolyhedron(this.geom, startPose, endPose)
  }
}
