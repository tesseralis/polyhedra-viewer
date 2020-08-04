import PolyhedronForme from "./PolyhedronForme"
import { Capstone, getSpecs } from "specs"
import { Polyhedron, Face, Edge, Cap, FaceLike } from "math/polyhedra"
import { vecEquals, isInverse } from "math/geom"
import { getGeometry } from "math/operations/operationUtils"
import { find } from "utils"

type Base = Face | Cap | Edge

// TODO add more useful functions here
export default abstract class CapstoneForme extends PolyhedronForme<Capstone> {
  static create(specs: Capstone, geom: Polyhedron) {
    switch (specs.data.count) {
      case 0:
        return specs.isSnub()
          ? new SnubCapstoneForme(specs, geom)
          : new PrismaticForme(specs, geom)
      case 1:
        return new MonoCapstoneForme(specs, geom)
      case 2:
        return new BiCapstoneForme(specs, geom)
    }
  }

  static fromSpecs(specs: Capstone) {
    return this.create(specs, getGeometry(specs))
  }

  static fromName(name: string) {
    const specs = getSpecs(name)
    if (!specs.isCapstone()) throw new Error(`Invalid specs for name`)
    return this.fromSpecs(specs)
  }

  abstract bases(): readonly [Base, Base]

  baseCaps() {
    return this.bases().filter((base) => base instanceof Cap) as Cap[]
  }

  baseFaces() {
    return this.bases().filter((base) => base instanceof Face) as Face[]
  }

  /**
   * Return the `FaceLike` representation of this capstone's bases:
   * either the face itself or the boundary of the cap.
   */
  baseBoundaries(): [FaceLike, FaceLike] {
    return this.bases().map((base) =>
      base instanceof Cap ? base.boundary() : base,
    ) as [FaceLike, FaceLike]
  }

  prismaticHeight() {
    const [top, bot] = this.baseBoundaries()
    return top.centroid().distanceTo(bot.centroid())
  }

  /**
   * Returns the base of the capstone that this face belongs to,
   * or undefined if the face does not belong to a base.
   */
  baseOf(face: Face) {
    return this.bases().find((base) => {
      if (base instanceof Cap) {
        return face.inSet(base.faces())
      } else if (base instanceof Edge) {
        return false
      } else {
        return face.equals(base)
      }
    })
  }

  /**
   * Return whether the given face is in one of the bases of the cap.
   */
  inBase(face: Face) {
    return !!this.baseOf(face)
  }

  /**
   * Returns true if the face belongs to the top face of a capstone base.
   */
  isBaseTop(face: Face) {
    const base = this.baseOf(face)
    if (base instanceof Edge) return false
    return base && vecEquals(face.normal(), base.normal())
  }
}

class PrismaticForme extends CapstoneForme {
  bases() {
    if (this.specs.isDigonal()) {
      const edge1 = this.geom.getEdge()
      const edge2 = find(this.geom.edges, (e) =>
        isInverse(
          e.midpoint().clone().sub(this.geom.centroid()),
          edge1.midpoint().clone().sub(this.geom.centroid()),
        ),
      )
      return [edge1, edge2] as const
    }
    const face1 = this.geom.faceWithNumSides(this.specs.baseSides())
    const face2 = find(this.geom.faces, (f) =>
      isInverse(face1.normal(), f.normal()),
    )
    return [face1, face2] as const
  }
}

class SnubCapstoneForme extends CapstoneForme {
  bases() {
    if (this.specs.isDigonal()) {
      const bases = this.geom.edges.filter((e) =>
        e.vertices.every((v) => v.adjacentFaces().length === 4),
      )
      if (bases.length !== 2) throw new Error(`Invalid number of bases`)
      return [bases[0], bases[1]] as const
    }
    // TODO dedupe with prismatic?
    const face1 = this.geom.faceWithNumSides(this.specs.baseSides())
    const face2 = find(this.geom.faces, (f) =>
      isInverse(face1.normal(), f.normal()),
    )
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
    const cap = find(this.geom.caps(), (cap) =>
      isInverse(cap.normal(), face.normal()),
    )
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
