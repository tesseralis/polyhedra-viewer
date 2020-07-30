import PolyhedronForme from "./PolyhedronForme"
import Capstone from "data/specs/Capstone"
import { Polyhedron, Face, Cap, FaceLike } from "math/polyhedra"
import { PRECISION, isInverse } from "math/geom"
import { getGeometry } from "math/operations/operationUtils"

type Base = Face | Cap

// TODO add more useful functions here
export default abstract class CapstoneForme extends PolyhedronForme<Capstone> {
  static create(specs: Capstone, geom: Polyhedron) {
    switch (specs.data.count) {
      case 0:
        return new PrismaticForme(specs, geom)
      case 1:
        return new MonoCapstoneForme(specs, geom)
      case 2:
        return new BiCapstoneForme(specs, geom)
    }
  }

  static fromSpecs(specs: Capstone) {
    return this.create(specs, getGeometry(specs))
  }

  abstract bases(): readonly [Base, Base]

  /**
   * Return the `FaceLike` representation of this capstone's bases:
   * either the face itself or the boundary of the cap.
   */
  baseFaces(): [FaceLike, FaceLike] {
    return this.bases().map((base) =>
      base instanceof Cap ? base.boundary() : base,
    ) as [FaceLike, FaceLike]
  }

  prismaticHeight() {
    const [top, bot] = this.baseFaces()
    return top.centroid().distanceTo(bot.centroid())
  }

  /**
   * Returns the base of the capstone that this face belongs to,
   * or undefined if the face does not belong to a base.
   */
  baseOf(face: Face) {
    return this.bases().find((base) =>
      base instanceof Cap ? face.inSet(base.faces()) : face.equals(base),
    )
  }

  /**
   * Return whether the given face is in one of the bases of the cap.
   */
  isBaseFace(face: Face) {
    return !!this.baseOf(face)
  }

  /**
   * Returns true if the face belongs to the top face of a capstone base.
   */
  isBaseTop(face: Face) {
    const base = this.baseOf(face)
    return base && face.normal().equalsWithTolerance(base.normal(), PRECISION)
  }
}

class PrismaticForme extends CapstoneForme {
  bases() {
    const face1 = this.geom.faceWithNumSides(this.specs.baseSides())
    const face2 = this.geom.faces.find((f) =>
      isInverse(face1.normal(), f.normal()),
    )!
    return [face1, face2] as const
  }
}

// FIXME deal with fastigium
class MonoCapstoneForme extends CapstoneForme {
  bases() {
    const base = this.specs.isPrimary()
      ? this.specs.data.base
      : this.specs.data.base * 2
    const face = this.geom.faceWithNumSides(base)
    const cap = this.geom
      .caps()
      .find((cap) => isInverse(cap.normal(), face.normal()))!
    return [cap, face] as const
  }
}

class BiCapstoneForme extends CapstoneForme {
  bases() {
    const caps = this.geom.caps()
    for (const cap of this.geom.caps()) {
      const cap2 = caps.find((cap2) => isInverse(cap.normal(), cap2.normal()))
      if (!cap2) continue
      // Favor the cupola over the rotunda as the "top" face
      if (this.specs.isCupolaRotunda() && cap2.type === "rotunda") {
        return [cap2, cap] as const
      }
      return [cap, cap2] as const
    }
    throw new Error(`Could not find opposite caps`)
  }
}
