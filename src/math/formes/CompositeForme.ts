import { once } from "lodash-es"
import { getSingle } from "utils"
import PolyhedronForme from "./PolyhedronForme"
import Composite from "data/specs/Composite"
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

  protected capInnerVertIndices = once(() => {
    return new Set(
      this.caps().flatMap((cap) => cap.innerVertices().map((v) => v.index)),
    )
  })

  private sourceVertices() {
    return this.geom.vertices.filter(
      (v) => !this.capInnerVertIndices().has(v.index),
    )
  }

  /** Get the caps associated with this forme */
  // FIXME this is confusing because it can be subclassed
  caps() {
    return this.geom.caps()
  }

  // FIXME implement this for diminished/gyrate
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
  hasAlignment() {
    return super.hasAlignment() && this.specs.sourcePrism().isSecondary()
  }

  modifications() {
    return this.caps()
  }

  isSideFace(face: Face) {
    // FIXME deal with square prism
    return face.numSides === 4
  }

  canAugment(face: Face) {
    if (!this.isSideFace(face)) return false
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

  sourceSpecs() {
    if (!this.specs.data.source.isClassical()) {
      throw new Error(
        `Attempting to create an AugmentedClassicalForme for non-classical specs: ${this.specs.name()}`,
      )
    }
    return this.specs.data.source
  }

  caps() {
    const caps = super.caps()
    const specs = this.sourceSpecs()
    // If it's an augmented tetrahedron, only consider the first cap
    if (specs.isTetrahedral() && specs.isRegular()) {
      return [caps[0]]
    }
    return caps
  }

  // Functions that exclusive to augmented solids

  isMainFace(face: Face) {
    // Only source faces re main faces
    if (!this.isSourceFace(face)) return false
    // All regular faces are main faces
    if (this.sourceSpecs().isRegular()) return true
    // It's a main face if it's not a truncated face
    return face.numSides !== 3
  }

  mainFace() {
    const face = this.geom.faces.find((f) => this.isMainFace(f))
    if (!face)
      throw new Error(`Could not find a main face of AugmentedClassicalForme`)
    return face
  }

  mainFaces() {
    return this.geom.faces.filter((f) => this.isMainFace(f))
  }

  isMinorFace(face: Face) {
    return this.isSourceFace(face) && !this.isMainFace(face)
  }

  minorFace() {
    const face = this.geom.faces.find((f) => this.isMinorFace(f))
    if (!face)
      throw new Error(`Could not find a minor face of AugmentedClassicalForme`)
    return face
  }

  minorFaces() {
    return this.geom.faces.filter((f) => this.isMinorFace(f))
  }

  isInnerCapFace(face: Face) {
    if (this.sourceSpecs().isRegular()) return false
    return face.vertices.every((v) => this.capInnerVertIndices().has(v.index))
  }

  innerCapFaces() {
    return this.geom.faces.filter((f) => this.isInnerCapFace(f))
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
  // FIXME dedupe with gyrate
  isDiminshedFace(face: Face) {
    return (
      this.specs.isDiminished() &&
      face.numSides === this.geom.largestFace().numSides
    )
  }

  diminishedFaces() {
    return this.geom.faces.filter((f) => this.isDiminshedFace(f))
  }

  // FIXME deal with augmented tridiminished
  modifications() {
    return this.diminishedFaces()
  }

  canAugment(face: Face) {
    if (this.specs.isAugmented()) return false
    return (
      this.isDiminshedFace(face) ||
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
