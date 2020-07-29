import { Twist } from "types"
import PolyhedronForme from "./PolyhedronForme"
import Classical, { Facet, facets } from "data/specs/Classical"
import { Polyhedron, Face, Edge } from "math/polyhedra"

// FIXME dedupe with operationUtils
export function oppositeFace(edge: Edge, twist?: Twist) {
  switch (twist) {
    case "left":
      return edge.twin().next().twin().prev().twinFace()
    case "right":
      return edge.twin().prev().twin().next().twinFace()
    default:
      // If no twist is provided, assume a square
      return edge.twin().next().next().twinFace()
  }
}

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
    const face = this.geom.faces.find((face) => this.isFacetFace(face, facet))
    if (!face) {
      throw new Error(`Could not find facet face for ${facet}`)
    }
    return face
  }

  /**
   * Define the set of facet faces for a solid with tetrahedral symmetry.
   */
  protected abstract tetrahedralFacetFaces(facet: Facet): Face[]

  facetFaces(facet: Facet) {
    if (this.specs.isTetrahedral()) return this.tetrahedralFacetFaces(facet)
    return this.geom.faces.filter((face) => this.isFacetFace(face, facet))
  }

  protected abstract adjacentFacetFace(face: Face, facet: Facet): Face

  adjacentFacetFaces(facet: Facet) {
    const f0 = this.facetFace(facet)
    return [f0, this.adjacentFacetFace(f0, facet)]
  }

  mainFacet() {
    if (!this.specs.data.facet) {
      throw new Error(`Polyhedron has no main facet`)
    }
    return this.specs.data.facet
  }

  minorFacet() {
    if (!this.specs.data.facet) {
      throw new Error(`Polyhedron has no main facet`)
    }
    return this.specs.data.facet === "vertex" ? "face" : "vertex"
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
    const face = this.geom.faces.find((face) => this.isEdgeFace(face))
    if (!face) {
      throw new Error(`Could not find edge face`)
    }
    return face
  }
}

class RegularForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    return facet === this.specs.data.facet
  }

  tetrahedralFacetFaces(facet: Facet) {
    return facet === this.specs.data.facet ? this.geom.faces : []
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    // NOTE this doesn't account for when the face isn't a facet face
    return face.adjacentFaces()[0]
  }
}

class TruncatedForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    if (this.specs.data.facet === facet) {
      return face.numSides > 5
    } else {
      return face.numSides <= 5
    }
  }

  tetrahedralFacetFaces(facet: Facet) {
    return this.geom.faces.filter(
      (f) => f.numSides === (this.specs.data.facet === facet ? 6 : 3),
    )
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    // FIXME assert valid
    return face.adjacentFaces().find((f) => this.isFacetFace(f, facet))!
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
    return face.vertices[0]
      .adjacentFaces()
      .find((f) => this.isFacetFace(f, facet) && !f.equals(face))!
  }
}

class BevelledForme extends ClassicalForme {
  faceType(facet: Facet) {
    return 2 * super.faceType(facet)
  }

  tetrahedralFacetFaces(facet: Facet) {
    let f0 = this.geom.faceWithNumSides(6)
    if (facet === "vertex") {
      f0 = f0.adjacentFaces().find((f) => f.numSides === 6)!
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
    return oppositeFace(
      face.edges.filter((e) => this.isEdgeFace(e.twinFace()))[0],
    )
  }
}

class SnubForme extends ClassicalForme {
  _isFacetFace(face: Face, facet: Facet) {
    return (
      super._isFacetFace(face, facet) &&
      face.adjacentFaces().every((f) => f.numSides === 3)
    )
  }

  tetrahedralFacetFaces(facet: Facet) {
    // FIXME return a different set on facet faces
    const f0 = this.geom.faceWithNumSides(3)
    return [f0, ...f0.edges.map((e) => oppositeFace(e, this.specs.data.twist))]
  }

  adjacentFacetFace(face: Face, facet: Facet) {
    let twist = this.specs.data.twist
    if (facet === "vertex") twist = twist === "left" ? "right" : "left"
    return oppositeFace(
      face.edges.filter((e) => this.isEdgeFace(e.twinFace()))[0],
      twist,
    )
  }
}
