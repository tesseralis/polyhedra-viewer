import { find } from "lib/utils"
import { Classical, FacetType, oppositeTwist } from "specs"
import { Polyhedron, Face } from "math/polyhedra"
import { floatEquals } from "math/geom"
import { getGeometry, oppositeFace } from "math/operations/operationUtils"
import BaseForme from "./BaseForme"
import { ClassicalFace } from "./FaceType"
import { Family } from "specs/Classical"

export default abstract class ClassicalForme extends BaseForme<Classical> {
  static create(specs: Classical, geom: Polyhedron) {
    switch (specs.data.operation) {
      case "regular":
        return new RegularForme(specs, geom)
      case "truncate":
        return new TruncatedForme(specs, geom)
      case "rectify":
        return new RectifiedForme(specs, geom)
      case "bevel":
        return new BevelledForme(specs, geom)
      case "cantellate":
        return new CantellatedForme(specs, geom)
      case "snub":
        return new SnubForme(specs, geom)
    }
  }

  static fromSpecs(specs: Classical) {
    return this.create(specs, getGeometry(specs))
  }

  static fromName(name: string) {
    return this.fromSpecs(Classical.query.withName(name))
  }

  faceType(facet: FacetType): number {
    return facet === "vertex" ? 3 : this.specs.data.family
  }

  protected _getFacet(face: Face) {
    if (face.numSides === this.faceType("face")) return "face"
    if (face.numSides === this.faceType("vertex")) return "vertex"
    return null
  }

  getFacet(face: Face) {
    if (this.specs.isTetrahedral()) {
      if (face.inSet(this.tetrahedralFacetFaces("face"))) return "face"
      if (face.inSet(this.tetrahedralFacetFaces("vertex"))) return "vertex"
      return null
    }
    return this._getFacet(face)
  }

  /**
   * Define the set of facet faces for a solid with tetrahedral symmetry.
   */
  // TODO I think there's another optimization here: tetrahedral faces can always be found
  // using `adjacentFacetFace` so maybe we can use that instead?
  protected abstract tetrahedralFacetFaces(facet: FacetType): Face[]

  facetFaces(facet: FacetType) {
    if (this.specs.isTetrahedral()) return this.tetrahedralFacetFaces(facet)
    return super.facetFaces(facet)
  }

  adjacentFacetFaces(facet: FacetType): [Face, Face] {
    const f0 = this.facetFace(facet)
    // Use the angle table to find another facet face with the correct incidence angle
    const f1 = find(this.facetFaces(facet), (other) =>
      floatEquals(
        f0.normal().angleTo(other.normal()),
        adjacentFaceAngles[this.specs.data.family][facet],
      ),
    )!
    return [f0, f1]
  }

  /** Return the inradius of the given type of face */
  inradius(facet: FacetType) {
    return this.facetFace(facet).distanceToCenter()
  }

  midradius(): number {
    throw new Error(
      `Polyhedron ${this.specs.name()} does not have consistent midradius`,
    )
  }

  circumradius() {
    return this.geom.getVertex().distanceToCenter()
  }

  // @override
  orientation() {
    // For the vertex-based Platonic solids, we want to center it on the vertex
    if (this.specs.isRegular() && this.specs.isVertex()) {
      const v = this.geom.getVertex()
      return [v.vec.clone().negate(), v.adjacentVertices()[0]] as const
    }
    const [f1, f2] = this.adjacentFacetFaces("face")
    return [f1.normal().clone().negate(), f2] as const
  }

  faceAppearance(face: Face) {
    const facet = this.getFacet(face)
    if (facet) {
      const polygonType = face.numSides > 5 ? "secondary" : "primary"
      return ClassicalFace.facet(this.specs.data.family, polygonType, facet)
    } else {
      const expansion = face.numSides === 3 ? "antiprism" : "prism"
      return ClassicalFace.edge(this.specs.data.family, expansion)
    }
  }
}

class RegularForme extends ClassicalForme {
  _getFacet(face: Face) {
    return this.specs.facet()
  }

  tetrahedralFacetFaces(facet: FacetType) {
    return facet === this.specs.facet() ? this.geom.faces : []
  }

  midradius() {
    return this.geom.getEdge().distanceToCenter()
  }

  caps() {
    if (this.specs.isFace()) return []
    return this.geom.caps({ base: this.specs.data.family, type: "primary" })
  }
}

class TruncatedForme extends ClassicalForme {
  faceType(facet: FacetType) {
    const faceType = super.faceType(facet)
    return this.specs.facet() === facet ? 2 * faceType : faceType
  }

  tetrahedralFacetFaces(facet: FacetType) {
    return this.geom.facesWithNumSides(this.specs.facet() === facet ? 6 : 3)
  }
}

class RectifiedForme extends ClassicalForme {
  tetrahedralFacetFaces(facet: FacetType) {
    let f0 = this.geom.getFace()
    if (facet === "vertex") {
      f0 = f0.adjacentFaces()[0]
    }
    return [f0, ...f0.edges.map((e) => e.twin().prev().twinFace())]
  }
}

class BevelledForme extends ClassicalForme {
  faceType(facet: FacetType) {
    return 2 * super.faceType(facet)
  }

  tetrahedralFacetFaces(facet: FacetType) {
    let f0 = this.geom.faceWithNumSides(6)
    if (facet === "vertex") {
      f0 = find(f0.adjacentFaces(), (f) => f.numSides === 6)
    }
    const rest = f0.edges
      .filter((e) => e.twinFace().numSides === 4)
      .map((e) => oppositeFace(e))
    return [f0, ...rest]
  }
}

class CantellatedForme extends ClassicalForme {
  _getFacet(face: Face) {
    const facet = super._getFacet(face)
    if (facet !== "face") return facet
    return face.adjacentFaces().every((f) => f.numSides === 4) ? facet : null
  }

  tetrahedralFacetFaces(facet: FacetType) {
    let f0 = this.geom.faceWithNumSides(3)
    if (facet === "vertex") {
      f0 = f0.edges[0].twin().next().twinFace()
    }
    return [f0, ...f0.edges.map((e) => oppositeFace(e))]
  }

  caps() {
    const caps = this.geom.caps({
      base: this.specs.data.family,
      type: "secondary",
    })
    if (!this.specs.isTetrahedral()) return caps
    // If tetrahedral, only count caps with a *face* facet as a top
    return caps.filter((cap) => this.isFacetFace(cap.topFace(), "face"))
  }
}

class SnubForme extends ClassicalForme {
  _getFacet(face: Face) {
    const facet = super._getFacet(face)
    if (facet !== "vertex") return facet
    return face.adjacentFaces().every((f) => f.numSides === 3) ? facet : null
  }

  tetrahedralFacetFaces = (facet: FacetType) => {
    let f0 = this.geom.faces[0]
    const edge = f0.edges[0].twin()
    let { twist } = this.specs.data
    if (facet === "vertex") {
      f0 = twist === "left" ? edge.prev().twinFace() : edge.next().twinFace()
      twist = oppositeTwist(twist!)
    }
    return [f0, ...f0.edges.map((e) => oppositeFace(e, twist))]
  }
}

const { PI, acos, sqrt } = Math
/**
 * A table of the angle between adjacent facet faces of different families,
 * used to calculate adjacent faces for orientation.
 *
 * The adjacent face angle is 180deg minus the dihedral angle of the
 * corresponding Platonic solid.
 *
 * The dihedral angles are obtained from the corresponding Wikipedia pages
 * of the Platonic solids.
 */
const adjacentFaceAngles: Record<Family, Record<FacetType, number>> = {
  3: {
    face: PI - acos(1 / 3),
    vertex: PI - acos(1 / 3),
  },
  4: {
    face: PI / 2,
    vertex: PI - acos(-1 / 3),
  },
  5: {
    face: PI - acos(-1 / sqrt(5)),
    vertex: PI - acos(-sqrt(5) / 3),
  },
}
