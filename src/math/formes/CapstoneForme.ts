import PolyhedronForme from "./PolyhedronForme"
import Capstone from "data/specs/Capstone"
import { Polyhedron, Face, Cap, FaceLike } from "math/polyhedra"
import { isInverse } from "math/geom"

type Base = Face | Cap

// TODO add more useful functions here
export default abstract class CapstoneForme extends PolyhedronForme<Capstone> {
  static create(specs: Capstone, geom: Polyhedron) {
    return specs.isBi()
      ? new BiCapstoneForme(specs, geom)
      : new MonoCapstoneForme(specs, geom)
  }

  abstract bases(): readonly [Base, Base]

  baseFaces(): [FaceLike, FaceLike] {
    return this.bases().map((base) =>
      base instanceof Cap ? base.boundary() : base,
    ) as [FaceLike, FaceLike]
  }

  prismaticHeight() {
    const [top, bot] = this.baseFaces()
    return top.centroid().distanceTo(bot.centroid())
  }
}

class MonoCapstoneForme extends CapstoneForme {
  bases() {
    const base = this.specs.isPyramid()
      ? this.specs.data.base
      : this.specs.data.base * 2
    const face = this.geom.faceWithNumSides(base)
    const cap = Cap.getAll(this.geom).find((cap) =>
      isInverse(cap.normal(), face.normal()),
    )!
    return [cap, face] as const
  }
}

class BiCapstoneForme extends CapstoneForme {
  bases() {
    const caps = Cap.getAll(this.geom)
    for (const cap of caps) {
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
