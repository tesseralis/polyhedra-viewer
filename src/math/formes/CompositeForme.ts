import { once } from "lodash-es"
import { find, getSingle } from "utils"
import BaseForme from "./BaseForme"
import { getGeometry } from "math/operations/operationUtils"
import { Composite, FacetType } from "specs"
import { Polyhedron, Face, Cap } from "math/polyhedra"
import { getCentroid } from "math/geom"

type Base = Cap | Face

export default abstract class CompositeForme extends BaseForme<Composite> {
  static create(specs: Composite, geom: Polyhedron) {
    // TODO lol maybe it's time for a visitor
    if (specs.isAugmentedPrism()) {
      return new AugmentedPrismForme(specs, geom)
    } else if (specs.isAugmentedClassical()) {
      return new AugmentedClassicalForme(specs, geom)
    } else if (specs.isDiminishedSolid()) {
      return new DiminishedSolidForme(specs, geom)
    } else if (specs.isGyrateSolid()) {
      return new GyrateSolidForme(specs, geom)
    }
    throw new Error(`Invalid composite specs: ${specs.name()}`)
  }

  static fromSpecs(specs: Composite) {
    return this.create(specs, getGeometry(specs))
  }

  static fromName(name: string) {
    const specs = Composite.query.withName(name)
    return this.fromSpecs(specs)
  }

  isAugmentedClassical(): this is AugmentedClassicalForme {
    return this.specs.isAugmentedClassical()
  }

  isAugmentedPrism(): this is AugmentedPrismForme {
    return this.specs.isAugmentedPrism()
  }

  isDiminishedSolid(): this is DiminishedSolidForme {
    return this.specs.isDiminishedSolid()
  }

  isGyrateSolid(): this is GyrateSolidForme {
    return this.specs.isGyrateSolid()
  }

  protected capInnerVertIndices = once(() => {
    return new Set(
      this.caps().flatMap((cap) => cap.innerVertices().map((v) => v.index)),
    )
  })

  protected sourceVertices() {
    return this.geom.vertices.filter(
      (v) => !this.capInnerVertIndices().has(v.index),
    )
  }

  abstract caps(): Cap[]

  // TODO implement this for diminished/gyrate
  sourceCentroid() {
    return getCentroid(this.sourceVertices().map((v) => v.vec))
  }

  /** Returns whether the given face is part of the source polyhedron (as opposed to a cap) */
  isSourceFace(face: Face) {
    return face.vertices.every((v) => !this.capInnerVertIndices().has(v.index))
  }

  /** Return whether this solid can be modified in a way that creates separate alignments */
  hasAlignment() {
    return this.specs.isMono()
  }

  abstract modifications(): Base[]

  alignment(cap: Base) {
    if (!this.hasAlignment()) return undefined
    return cap.isInverse(getSingle(this.modifications())) ? "para" : "meta"
  }

  abstract canAugment(face: Face): boolean

  isCapTop(face: Face) {
    // if (this.specs.sourceClassical().isRegular()) return false
    return face.vertices.every((v) => this.capInnerVertIndices().has(v.index))
  }

  capTops() {
    return this.geom.faces.filter((f) => this.isCapTop(f))
  }

  isGyrate(cap: Cap) {
    return false
  }

  faceAppearance(face: Face): any {
    const source = this.specs.sourceClassical()
    const polygonType = this.specs.sourceClassical().isTruncated()
      ? "secondary"
      : "primary"

    if (this.isSourceFace(face)) {
      if (this.isFacetFace(face, "face")) {
        return {
          type: "classical",
          family: source.data.family,
          polygonType: face.numSides > 5 ? "secondary" : "primary",
          facet: "face",
        }
      } else if (this.isFacetFace(face, "vertex")) {
        return {
          type: "classical",
          family: source.data.family,
          polygonType: face.numSides > 5 ? "secondary" : "primary",
          facet: "vertex",
        }
      } else {
        return {
          type: "classical",
          family: source.data.family,
          polygonType: face.numSides > 5 ? "secondary" : "primary",
          expansion: "prism",
        }
      }
    } else if (
      (this.isDiminishedSolid() || this.isGyrateSolid()) &&
      this.isDiminishedFace(face)
    ) {
      return {
        type: "classical",
        family: source.data.family,
        polygonType: face.numSides > 5 ? "secondary" : "primary",
        facet: "face",
      }
    } else {
      // augmented cap face
      const cap = find(this.caps(), (cap) => face.inSet(cap.faces()))
      return {
        type: "capstone",
        base: source.data.family,
        polygonType,
        capPosition: "side",
        sideColors: face.vertices.map((v) =>
          v.inSet(cap.innerVertices()) ? "top" : "base",
        ),
      }
    }
  }
}

export class AugmentedPrismForme extends CompositeForme {
  // @override
  orientation() {
    const caps = this.caps()
    const normal =
      this.specs.data.augmented === 2
        ? getCentroid(caps.map((c) => c.normal()))
        : caps[0].normal()
    return [this.endFaces()[0], normal] as const
  }

  // @override
  isFacetFace(face: Face, facet: FacetType): boolean {
    throw new Error(`Augmented prisms do not have facet faces`)
  }

  caps = once(() => {
    return this.geom.caps({ type: "primary", base: 4 })
  })

  hasAlignment() {
    return super.hasAlignment() && this.specs.sourcePrism().isSecondary()
  }

  modifications() {
    return this.caps()
  }

  endFaces = once(() => {
    const source = this.specs.sourcePrism()
    if (source.isPrimary() && source.isTriangular()) {
      for (const face1 of this.geom.faces) {
        for (const face2 of this.geom.faces) {
          if (face1.isInverse(face2)) {
            return [face1, face2] as const
          }
        }
      }
      throw new Error(`Could not find base faces for ${this.specs.name()}`)
    }

    if (source.isSquare()) {
      for (const f1 of this.geom.facesWithNumSides(4)) {
        for (const f2 of this.geom.facesWithNumSides(4)) {
          if (f1.isInverse(f2)) {
            return [f1, f2] as const
          }
        }
      }
      throw new Error(`Error finding inverse faces`)
    }

    return this.geom.facesWithNumSides(
      this.specs.sourcePrism().baseSides(),
    ) as [Face, Face]
  })

  isEndFace(face: Face) {
    return face.inSet(this.endFaces())
  }

  isSideFace(face: Face) {
    // FIXME deal with square prism
    return face.numSides === 4
  }

  canAugment(face: Face) {
    if (!this.isSideFace(face)) return false
    if (this.specs.sourcePrism().baseSides() === 3) return true
    return this.caps().every((cap) =>
      cap
        .boundary()
        .adjacentFaces()
        .every((f) => !f.equals(face)),
    )
  }

  faceAppearance(face: Face): any {
    const source = this.specs.sourcePrism()
    if (this.isEndFace(face)) {
      return {
        type: "capstone",
        base: source.data.base,
        polygonType: source.data.type,
        capPosition: "prism",
      }
    } else if (this.isSideFace(face)) {
      return {
        type: "capstone",
        base: source.data.base,
        polygonType: source.data.type,
        elongation: "prism",
      }
    } else {
      const cap = find(this.caps(), (cap) => face.inSet(cap.faces()))
      return {
        type: "capstone",
        base: 4,
        polygonType: "primary",
        capPosition: "side",
        sideColors: face.vertices.map((v) => {
          return v.inSet(cap.innerVertices()) ? "top" : "base"
        }),
      }
    }
  }
}

export class AugmentedClassicalForme extends CompositeForme {
  // @override
  orientation() {
    const caps = this.caps()
    if (this.specs.isTri()) {
      const axis = getCentroid(caps.map((c) => c.normal()))
      return [axis, caps[0]] as const
    }
    if (this.specs.hasAlignment() && this.specs.isMeta()) {
      const axis = getCentroid(caps.map((c) => c.normal()))
      const cross = axis.clone().cross(caps[0].normal())
      return [axis, cross] as const
    }
    const cap = caps[0]
    const edge = find(cap.boundary().edges, (e) => e.face.numSides === 3)
    return [cap, edge] as const
  }

  hasAlignment() {
    return super.hasAlignment() && this.specs.sourceClassical().isIcosahedral()
  }

  modifications() {
    return this.caps()
  }

  caps = once(() => {
    const specs = this.specs.sourceClassical()
    const caps = this.geom.caps({
      type: specs.isTruncated() ? "secondary" : "primary",
      base: specs.data.family,
    })
    // If it's an augmented tetrahedron, only consider the first cap
    if (specs.isTetrahedral() && specs.isRegular()) {
      return this.specs.isAugmented() ? [caps[0]] : []
    }
    return caps
  })

  getFacet(face: Face) {
    if (!this.isSourceFace(face)) return null
    if (this.specs.sourceClassical().isRegular() || face.numSides !== 3) {
      return "face"
    } else {
      return "vertex"
    }
  }

  canAugment(face: Face) {
    if (!this.isFacetFace(face, "face")) return false
    return this.caps().every((cap) =>
      cap
        .boundary()
        .adjacentFaces()
        .every((f) => !f.equals(face)),
    )
  }
}

export class DiminishedSolidForme extends CompositeForme {
  caps = once(() => {
    return this.geom
      .caps({ type: "primary", base: 5 })
      .concat(this.geom.caps({ type: "primary", base: 3 }))
  })

  // @override
  getFacet(face: Face) {
    return this.isSourceFace(face) ? "face" : null
  }

  // @override
  orientation() {
    const faces = this.diminishedFaces()
    if (this.specs.isAugmented() || this.specs.isTri()) {
      const normal = getCentroid(faces.map((f) => f.normal()))
      return [normal, faces[0]] as const
    }
    if (this.specs.hasAlignment() && this.specs.isMeta()) {
      const axis = getCentroid(faces.map((f) => f.normal()))
      const cross = axis.clone().cross(faces[0].normal())
      return [axis, cross] as const
    }
    return [faces[0], faces[0].edges[0]] as const
  }

  // TODO dedupe with gyrate
  isDiminishedFace(face: Face) {
    return (
      this.specs.isDiminished() &&
      face.numSides === this.geom.largestFace().numSides
    )
  }

  augmentedCaps() {
    if (!this.specs.isAugmented()) return []
    return this.caps().filter((cap) => cap.boundary().numSides === 3)
  }

  diminishedFaces() {
    return this.geom.faces.filter((f) => this.isDiminishedFace(f))
  }

  isAugmentedFace(face: Face) {
    if (!this.specs.isAugmented()) return false
    return face.inSet(this.augmentedCaps()[0].faces())
  }

  modifications() {
    return [...this.diminishedFaces(), ...this.augmentedCaps()]
  }

  canAugment(face: Face) {
    if (this.specs.isAugmented()) return false
    return (
      this.isDiminishedFace(face) ||
      face.adjacentFaces().every((f) => f.numSides === 5)
    )
  }
}

export class GyrateSolidForme extends CompositeForme {
  caps = once(() => {
    return this.geom.caps({ type: "secondary", base: 5 })
  })

  // @override
  orientation() {
    const mods = this.modifications()
    if (mods.length === 0) {
      // TODO return orientation of the base
      return [this.geom.faces[0], this.geom.faces[1]] as const
    }
    // FIXME make this more sophisticated
    const boundary = mods[0] instanceof Cap ? mods[0].boundary() : mods[0]
    return [mods[0], boundary.edges[0]] as const
  }

  /** Return whether the given cap is gyrated */
  isGyrate(cap: Cap) {
    return cap.boundary().edges.every((edge) => {
      const [n1, n2] = edge.adjacentFaces().map((f) => f.numSides)
      return (n1 === 4) === (n2 === 4)
    })
  }

  gyrateCaps() {
    return this.caps().filter((cap) => this.isGyrate(cap))
  }

  gyrateFaces = once(() => {
    return this.gyrateCaps().flatMap((cap) => cap.faces())
  })

  isGyrateFace(face: Face) {
    return face.inSet(this.gyrateFaces())
  }

  isDiminishedFace(face: Face) {
    return (
      this.specs.isDiminished() &&
      face.numSides === this.geom.largestFace().numSides
    )
  }

  diminishedFaces() {
    return this.geom.faces.filter((f) => this.isDiminishedFace(f))
  }

  // @override
  getFacet(face: Face) {
    if (face.numSides === 5) return "face"
    if (face.numSides === 3) return "vertex"
    return null
  }

  isEdgeFace(face: Face) {
    return face.numSides === 4
  }

  /**
   * Returns the single diminished or gyrate face of this polyhedron.
   */
  modifications() {
    return [...this.gyrateCaps(), ...this.diminishedFaces()]
  }

  canAugment(face: Face) {
    return this.isDiminishedFace(face)
  }
}
