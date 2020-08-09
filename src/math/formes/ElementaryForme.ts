import { Elementary } from "specs"
import BaseForme from "./BaseForme"
import { Polyhedron } from "math/polyhedra"

export default class ElementaryForme extends BaseForme<Elementary> {
  static create(specs: Elementary, geom: Polyhedron) {
    return new ElementaryForme(specs, geom)
  }
}
