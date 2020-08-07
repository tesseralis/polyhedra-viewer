import { once } from "lodash-es"
import { find, getSingle } from "utils"
import PolyhedronForme from "./PolyhedronForme"
import { getGeometry } from "math/operations/operationUtils"
import { Composite } from "specs"
import { Polyhedron, Face, Cap } from "math/polyhedra"
import { getCentroid, isInverse } from "math/geom"

type Base = Cap | Face

export default abstract class CompositeForme extends PolyhedronForme<
  Composite
> {
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

  /** Get the caps associated with this forme */
  caps() {
    return this.geom.caps()
  }

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
    return isInverse(cap.normal(), getSingle(this.modifications()).normal())
      ? "para"
      : "meta"
  }

  abstract canAugment(face: Face): boolean
}

export class AugmentedPrismForme extends CompositeForme {
  // @override
  orientation() {
    const caps = this.caps()
    const normal =
      this.specs.data.augmented === 2
        ? getCentroid(caps.map((c) => c.normal()))
        : caps[0].normal()
    return [this.endFaces()[0].normal(), normal] as const
  }

  caps() {
    return super.caps().filter((cap) => cap.type === "pyramid")
  }

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
          if (isInverse(face1.normal(), face2.normal())) {
            return [face1, face2] as const
          }
        }
      }
      throw new Error(`Could not find base faces for ${this.specs.name()}`)
    }

    if (source.isSquare()) {
      // FIXME why doesn't this work??
      for (const f1 of this.geom.facesWithNumSides(4)) {
        for (const f2 of this.geom.facesWithNumSides(4)) {
          if (isInverse(f1.normal(), f2.normal())) {
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
    console.log(this.endFaces())
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
}

export class AugmentedClassicalForme extends CompositeForme {
  hasAlignment() {
    return super.hasAlignment() && this.specs.sourceClassical().isIcosahedral()
  }

  modifications() {
    return this.caps()
  }

  caps() {
    const caps = super.caps()
    const specs = this.specs.sourceClassical()
    // If it's an augmented tetrahedron, only consider the first cap
    if (specs.isTetrahedral() && specs.isRegular()) {
      return this.specs.isAugmented() ? [caps[0]] : []
    }
    return caps
  }

  // Functions that exclusive to augmented solids

  isMainFace(face: Face) {
    // Only source faces re main faces
    if (!this.isSourceFace(face)) return false
    // All regular faces are main faces
    if (this.specs.sourceClassical().isRegular()) return true
    // It's a main face if it's not a truncated face
    return face.numSides !== 3
  }

  mainFace() {
    return find(this.geom.faces, (f) => this.isMainFace(f))
  }

  mainFaces() {
    return this.geom.faces.filter((f) => this.isMainFace(f))
  }

  isMinorFace(face: Face) {
    return this.isSourceFace(face) && !this.isMainFace(face)
  }

  minorFace() {
    return find(this.geom.faces, (f) => this.isMinorFace(f))
  }

  minorFaces() {
    return this.geom.faces.filter((f) => this.isMinorFace(f))
  }

  isCapTop(face: Face) {
    if (this.specs.sourceClassical().isRegular()) return false
    return face.vertices.every((v) => this.capInnerVertIndices().has(v.index))
  }

  capTops() {
    return this.geom.faces.filter((f) => this.isCapTop(f))
  }

  canAugment(face: Face) {
    if (!this.isMainFace(face)) return false
    return this.caps().every((cap) =>
      cap
        .boundary()
        .adjacentFaces()
        .every((f) => !f.equals(face)),
    )
  }
}

export class DiminishedSolidForme extends CompositeForme {
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
  /** Return whether the given cap is gyrated */
  isGyrate(cap: Cap) {
    return cap.boundary().edges.every((edge) => {
      const [n1, n2] = edge.adjacentFaces().map((f) => f.numSides)
      return (n1 === 4) === (n2 === 4)
    })
  }

  gyrateCaps() {
    return this.geom.caps().filter((cap) => this.isGyrate(cap))
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
