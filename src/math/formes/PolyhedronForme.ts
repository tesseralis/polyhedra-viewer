import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

import type ClassicalForme from "./ClassicalForme"
import type CapstoneForme from "./CapstoneForme"
import type CompositeForme from "./CompositeForme"

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
}
