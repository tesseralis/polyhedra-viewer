import { mean } from "lodash-es"
import { PolyhedronSpecs, FacetType } from "specs"
import { Polyhedron, Face } from "math/polyhedra"

import { Classical, Capstone, Composite, Elementary } from "specs"
import type ClassicalForme from "./ClassicalForme"
import type CapstoneForme from "./CapstoneForme"
import type CompositeForme from "./CompositeForme"
import type ElementaryForme from "./ElementaryForme"
import { Vector3 } from "three"
import {
  Orientation,
  Pose,
  alignPolyhedron,
} from "math/operations/operationUtils"
import { find } from "utils"

export type PolyhedronForme<
  S extends PolyhedronSpecs = PolyhedronSpecs
> = S extends Classical
  ? ClassicalForme
  : S extends Capstone
  ? CapstoneForme
  : S extends Composite
  ? CompositeForme
  : S extends Elementary
  ? ElementaryForme
  : never

interface ClassicalFace {
  type: "classical"
  family: 3 | 4 | 5
  polygonType: "primary" | "secondary"
  facet?: "face" | "vertex"
  expansion?: "prism" | "antiprism"
}

interface CapstoneFace {
  type: "capstone"
  polygonType: "primary" | "secondary"
  base: 2 | 3 | 4 | 5
  elongation?: "prism" | "antiprism"
  capPosition?: "prism" | "top" | "side"
  sideColors?: ("top" | "middle" | "base")[]
}

export type FaceType = ClassicalFace | CapstoneFace

export default abstract class BaseForme<Specs extends PolyhedronSpecs> {
  specs: Specs
  geom: Polyhedron

  constructor(specs: Specs, geom: Polyhedron) {
    this.specs = specs
    this.geom = geom
  }

  isClassical(): this is ClassicalForme {
    return this.specs.isClassical()
  }

  isCapstone(): this is CapstoneForme {
    return this.specs.isCapstone()
  }

  isComposite(): this is CompositeForme {
    return this.specs.isComposite()
  }

  isElementary(): this is ElementaryForme {
    return this.specs.isElementary()
  }

  abstract orientation(): Orientation

  orient() {
    const startPose: Pose = {
      // TODO correctly center diminished polyhedra
      origin: this.geom.centroid(),
      scale: mean(this.geom.edges.map((e) => e.distanceToCenter())),
      orientation: this.orientation(),
    }

    const endPose: Pose = {
      origin: new Vector3(),
      scale: 1,
      orientation: [new Vector3(0, 1, 0), new Vector3(0, 0, 1)],
    }
    return alignPolyhedron(this.geom, startPose, endPose)
  }

  abstract faceAppearance(face: Face): FaceType

  getFacet(face: Face): FacetType | null {
    throw new Error(`Forme ${this.specs.name()} does not support getFacet`)
  }

  isFacetFace(face: Face, facet: FacetType) {
    return this.getFacet(face) === facet
  }

  isAnyFacetFace(face: Face) {
    return !!this.getFacet(face)
  }

  facetFace(facet: FacetType) {
    return find(this.geom.faces, (face) => this.isFacetFace(face, facet))
  }

  facetFaces(facet: FacetType) {
    return this.geom.faces.filter((face) => this.isFacetFace(face, facet))
  }
}
