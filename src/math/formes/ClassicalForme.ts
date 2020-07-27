import { Twist } from "types"
import PolyhedronForme from "./PolyhedronForme"
import Classical, { Facet } from "data/specs/Classical"
import { Polyhedron, Face, Edge } from "math/polyhedra"

// FIXME dedupe
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
        throw new Error("Not implemented yet")
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
   * Return whether the given face corresponds to the given facet
   */
  isFacetFace(face: Face, facet: Facet) {
    // This should be overriden by subclasses
    return face.numSides === this.faceType(facet)
  }

  facetFace(facet: Facet) {
    const face = this.geom.faces.find((face) => this.isFacetFace(face, facet))
    if (!face) {
      throw new Error(`Could not find facet face for ${facet}`)
    }
    return face
  }

  facetFaces(facet: Facet) {
    return this.geom.faces.filter((face) => this.isFacetFace(face, facet))
  }

  mainFacetFace() {
    if (!this.specs.data.facet) {
      throw new Error(`Polyhedron has no main facet`)
    }
    return this.facetFace(this.specs.data.facet)
  }
}

class RegularForme extends ClassicalForme {
  // TODO deal with tetrahedral
  isFacetFace(face: Face, facet: Facet) {
    return facet === this.specs.data.facet
  }
}

class TruncatedForme extends ClassicalForme {
  // TODO deal with tetrahedral
  isFacetFace(face: Face, facet: Facet) {
    if (this.specs.data.facet === facet) {
      return face.numSides > 5
    } else {
      return face.numSides <= 5
    }
  }
}

// class RectifiedForme

class BevelledForme extends ClassicalForme {
  faceType(facet: Facet) {
    return 2 * super.faceType(facet)
  }

  // FIXME override isFacetFace as well
  facetFaces(facet: Facet) {
    if (!this.specs.isTetrahedral()) return super.facetFaces(facet)
    // FIXME return a different set of faces if facet === 'vertex'
    const f0 = this.geom.faceWithNumSides(6)
    const rest = f0.edges
      .filter((e) => e.twinFace().numSides === 4)
      .map((e) => oppositeFace(e))
    return [f0, ...rest]
  }
}

class CantellatedForme extends ClassicalForme {
  // FIXME deal with tetrahedral
  isFacetFace(face: Face, facet: Facet) {
    return (
      super.isFacetFace(face, facet) &&
      face.adjacentFaces().every((f) => f.numSides === 4)
    )
  }

  facetfaces(facet: Facet) {
    if (!this.specs.isTetrahedral()) return super.facetFaces(facet)
    let f0 = this.geom.faceWithNumSides(3)
    if (facet === "vertex") {
      f0 = f0.edges[0].twin().next().twinFace()
    }
    return [f0, ...f0.edges.map((e) => oppositeFace(e))]
  }
}

class SnubForme extends ClassicalForme {
  // FIXME deal with tetrahedral
  isFacetFace(face: Face, facet: Facet) {
    return (
      super.isFacetFace(face, facet) &&
      face.adjacentFaces().every((f) => f.numSides === 3)
    )
  }

  facetFaces(facet: Facet) {
    if (!this.specs.isTetrahedral()) return super.facetFaces(facet)
    // FIXME return a different set on facet faces and twist
    const f0 = this.geom.faceWithNumSides(3)
    return [f0, ...f0.edges.map((e) => oppositeFace(e, "right"))]
  }
}
