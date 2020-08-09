import { find } from "utils"
import { Vector3 } from "three"
import { Classical, Facet, facets, oppositeFacet, oppositeTwist } from "specs"
import { Polyhedron, Face } from "math/polyhedra"
import { angleBetween } from "math/geom"
import { getGeometry, oppositeFace } from "math/operations/operationUtils"
import PolyhedronForme from "./PolyhedronForme"

export default abstract class ClassicalForme extends PolyhedronForme<
  Classical
> {
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

  faceType(facet: Facet): number {
    return facet === "vertex" ? 3 : this.specs.data.family
  }

  /**
   * Define a facet face for a non-tetrahedral solid
   */
  protected _isFacetFace(face: Face, facet: Facet) {
    return face.numSides === this.faceType(facet)
  }

  /**
   * Return whether the given face corresponds to the given facet
   */
  isFacetFace(face: Face, facet: Facet) {
    if (this.specs.isTetrahedral()) {
      return face.inSet(this.tetrahedralFacetFaces(facet))
    }
    // This should be overriden by subclasses
    return this._isFacetFace(face, facet)
  }

  isAnyFacetFace(face: Face) {
    return facets.some((facet) => this.isFacetFace(face, facet))
  }

  getFacet(face: Face) {
    if (this.isFacetFace(face, "vertex")) return "vertex"
    if (this.isFacetFace(face, "face")) return "face"
    return null
  }

  facetFace(facet: Facet) {
    return find(this.geom.faces, (face) => this.isFacetFace(face, facet))
  }

  /**
   * Define the set of facet faces for a solid with tetrahedral symmetry.
   */
  // TODO I think there's another optimization here: tetrahedral faces can always be found
  // using `adjacentFacetFace` so maybe we can use that instead?
  protected abstract tetrahedralFacetFaces(facet: Facet): Face[]

  facetFaces(facet: Facet) {
    if (this.specs.isTetrahedral()) return this.tetrahedralFacetFaces(facet)
    return this.geom.faces.filter((face) => this.isFacetFace(face, facet))
  }

  protected abstract adjacentFacetFace(face: Face, facet: Facet): Face

  adjacentFacetFaces(facet: Facet): [Face, Face] {
    const f0 = this.facetFace(facet)
    return [f0, this.adjacentFacetFace(f0, facet)]
  }

  mainFacet() {
    return this.specs.facet()
  }

  minorFacet() {
    return oppositeFacet(this.specs.facet())
  }

  isMainFacetFace(face: Face) {
    return this.isFacetFace(face, this.mainFacet())
  }

  isMinorFacetFace(face: Face) {
    return this.isFacetFace(face, this.minorFacet())
  }

  mainFacetFace() {
    return this.facetFace(this.mainFacet())
  }

  mainFacetFaces() {
    return this.facetFaces(this.mainFacet())
  }

  minorFacetFace() {
    return this.facetFace(this.minorFacet())
  }

  minorFacetFaces() {
    return this.facetFaces(this.minorFacet())
  }

  isEdgeFace(face: Face) {
    return !this.isAnyFacetFace(face)
  }

  edgeFace() {
    return find(this.geom.faces, (face) => this.isEdgeFace(face))
  }

  edgeFaces() {
    return this.geom.faces.filter((f) => this.isEdgeFace(f))
  }

  /** Return the inradius of the given type of face */
  inradius(facet: Facet) {
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

  /**
   * Return the amount that this forme's faces are twisted
   */
  snubAngle(facet: Facet) {
    return 0
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
}

class RegularForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    return facet === this.specs.facet()
  }

  tetrahedralFacetFaces(facet: Facet) {
    return facet === this.specs.facet() ? this.geom.faces : []
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    // NOTE this doesn't account for when the face isn't a facet face
    return face.adjacentFaces()[0]
  }

  midradius() {
    return this.geom.getEdge().distanceToCenter()
  }
}

class TruncatedForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    return this.specs.facet() === facet ? face.numSides > 5 : face.numSides <= 5
  }

  tetrahedralFacetFaces(facet: Facet) {
    return this.geom.facesWithNumSides(this.specs.facet() === facet ? 6 : 3)
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    if (facet === this.specs.facet()) {
      return find(face.adjacentFaces(), (f) => this.isFacetFace(f, facet))
    } else {
      return find(
        face.adjacentFaces()[0].adjacentFaces(),
        (f) => f.numSides === face.numSides && !f.equals(face),
      )
    }
  }
}

class RectifiedForme extends ClassicalForme {
  tetrahedralFacetFaces(facet: Facet) {
    let f0 = this.geom.getFace()
    if (facet === "vertex") {
      f0 = f0.adjacentFaces()[0]
    }
    return [f0, ...f0.edges.map((e) => e.twin().prev().twinFace())]
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    return find(
      face.vertices[0].adjacentFaces(),
      (f) => this.isFacetFace(f, facet) && !f.equals(face),
    )
  }
}

class BevelledForme extends ClassicalForme {
  faceType(facet: Facet) {
    return 2 * super.faceType(facet)
  }

  tetrahedralFacetFaces(facet: Facet) {
    let f0 = this.geom.faceWithNumSides(6)
    if (facet === "vertex") {
      f0 = find(f0.adjacentFaces(), (f) => f.numSides === 6)
    }
    const rest = f0.edges
      .filter((e) => e.twinFace().numSides === 4)
      .map((e) => oppositeFace(e))
    return [f0, ...rest]
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    return oppositeFace(
      face.edges.filter((e) => this.isEdgeFace(e.twinFace()))[0],
    )
  }
}

class CantellatedForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    return (
      super._isFacetFace(face, facet) &&
      face.adjacentFaces().every((f) => f.numSides === 4)
    )
  }

  tetrahedralFacetFaces(facet: Facet) {
    let f0 = this.geom.faceWithNumSides(3)
    if (facet === "vertex") {
      f0 = f0.edges[0].twin().next().twinFace()
    }
    return [f0, ...f0.edges.map((e) => oppositeFace(e))]
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    return oppositeFace(face.edges[0])
  }
}

class SnubForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    return (
      super._isFacetFace(face, facet) &&
      face.adjacentFaces().every((f) => f.numSides === 3)
    )
  }

  tetrahedralFacetFaces = (facet: Facet) => {
    let f0 = this.geom.faces[0]
    const edge = f0.edges[0].twin()
    let { twist } = this.specs.data
    if (facet === "vertex") {
      f0 = twist === "left" ? edge.prev().twinFace() : edge.next().twinFace()
      twist = oppositeTwist(twist!)
    }
    return [f0, ...f0.edges.map((e) => oppositeFace(e, twist))]
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    let twist = this.specs.data.twist
    if (facet === "vertex") twist = oppositeTwist(twist!)
    return oppositeFace(face.edges[0], twist)
  }

  snubAngle(facet: Facet) {
    const [face0, face1] = this.adjacentFacetFaces(facet)

    // TODO this is fragile and relies on face1 being attached to face0.edges[0]
    // Calculate the angle between the nearest apothem and the projected center of face1
    const angle = angleBetween(
      face0.centroid(),
      face0.edges[0].midpoint(),
      face0.plane().projectPoint(face1.centroid(), new Vector3()),
    )

    const twistSign = this.specs.data.twist === "left" ? -1 : 1
    // if vertex-solid, reverse the sign
    const facetSign = facet === "vertex" ? -1 : 1
    return twistSign * facetSign * angle
  }
}
