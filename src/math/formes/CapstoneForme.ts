import PolyhedronForme from "./PolyhedronForme"
import { Capstone, getSpecs } from "specs"
import { Polyhedron, Face, Edge, Cap, FaceLike, Facet } from "math/polyhedra"
import { vecEquals, isInverse, getCentroid } from "math/geom"
import { getGeometry } from "math/operations/operationUtils"
import { find } from "utils"

type CapstoneEnd = Facet

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

  abstract ends(): readonly [CapstoneEnd, CapstoneEnd]

  endCaps() {
    return this.ends().filter((end) => end instanceof Cap) as Cap[]
  }

  isEndCap(cap: Cap) {
    return this.endCaps().some((c) => vecEquals(c.normal(), cap.normal()))
  }

  endFaces() {
    return this.ends().filter((end) => end instanceof Face) as Face[]
  }

  isEndFace(face: Face) {
    return face.inSet(this.endFaces())
  }

  /**
   * Return the `FaceLike` representation of this capstone's ends:
   * either the face itself or the boundary of the cap.
   */
  endBoundaries(): [FaceLike, FaceLike] {
    return this.ends().map((end) =>
      end instanceof Cap ? end.boundary() : end,
    ) as [FaceLike, FaceLike]
  }

  prismaticHeight() {
    const [top, bot] = this.ends()
    return top.centroid().distanceTo(bot.centroid())
  }

  /**
   * Returns the end of the capstone that this face belongs to,
   * or undefined if the face does not belong to an end.
   */
  containingEnd(face: Face) {
    return this.ends().find((end) => {
      if (end instanceof Cap) {
        return face.inSet(end.faces())
      } else if (end instanceof Edge) {
        return false
      } else if (end instanceof Face) {
        return face.equals(end)
      }
      throw new Error("Unknown extremity")
    })
  }

  /**
   * Return whether the given face is in one of the ends of the cap.
   */
  isContainedInEnd(face: Face) {
    return !!this.containingEnd(face)
  }

  /**
   * Returns true if the face belongs to the top face of a capstone end.
   */
  isTop(face: Face) {
    const end = this.containingEnd(face)
    if (end instanceof Edge) return false
    return end && vecEquals(face.normal(), end.normal())
  }

  centroid() {
    return getCentroid(this.ends().map((end) => end.centroid()))
  }
}

class PrismaticForme extends CapstoneForme {
  ends() {
    if (this.specs.isDigonal()) {
      const edge1 = this.geom.getEdge()
      const edge2 = find(this.geom.edges, (e) =>
        isInverse(e.normal(), edge1.normal()),
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
  ends() {
    if (this.specs.isDigonal()) {
      const ends = this.geom.edges.filter((e) =>
        e.vertices.every((v) => v.adjacentFaces().length === 4),
      )
      if (ends.length !== 2) throw new Error(`Invalid number of capstone ends`)
      return [ends[0], ends[1]] as const
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
  ends() {
    const end = this.specs.isPrimary()
      ? this.specs.data.base
      : this.specs.data.base * 2
    const face = this.geom.faceWithNumSides(end)
    const cap = find(this.geom.caps(), (cap) =>
      isInverse(cap.normal(), face.normal()),
    )
    return [cap, face] as const
  }
}

class BiCapstoneForme extends CapstoneForme {
  ends() {
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
