import PolyhedronForme from "./PolyhedronForme"
import Prismatic from "data/specs/Prismatic"
import { isInverse } from "math/geom"
import { Polyhedron, Face } from "math/polyhedra"

export default class PrismaticForme extends PolyhedronForme<Prismatic> {
  static create(specs: Prismatic, geom: Polyhedron) {
    return new PrismaticForme(specs, geom)
  }

  bases(): [Face, Face] {
    const face1 = this.geom.faceWithNumSides(this.specs.data.base)
    const face2 = this.geom.faces.find((f) =>
      isInverse(face1.normal(), f.normal()),
    )!
    return [face1, face2]
  }
}
