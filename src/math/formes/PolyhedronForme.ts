import { PolyhedronSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"

export default class PolyhedronForme<
  Specs extends PolyhedronSpecs = PolyhedronSpecs
> {
  specs: Specs
  geom: Polyhedron

  constructor(specs: Specs, geom: Polyhedron) {
    this.specs = specs
    this.geom = geom
  }
}
