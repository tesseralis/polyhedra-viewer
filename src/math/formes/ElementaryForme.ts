import { Elementary } from "specs"
import PolyhedronForme from "./PolyhedronForme"
import { Polyhedron } from "math/polyhedra"

export default class ElementaryForme extends PolyhedronForme<Elementary> {
  static create(specs: Elementary, geom: Polyhedron) {
    return new ElementaryForme(specs, geom)
  }
}
