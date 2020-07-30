import { once } from "lodash-es"
import PolyhedronForme from "./PolyhedronForme"
import Composite from "data/specs/Composite"
import { Polyhedron, Face, Cap } from "math/polyhedra"
import { getCentroid } from "math/geom"

export default class CompositeForme extends PolyhedronForme<Composite> {
  static create(specs: Composite, geom: Polyhedron) {
    if (specs.isAugmentedClassical()) {
      return new AugmentedClassicalForme(specs, geom)
    }
    // TODO more subclasses
    return new CompositeForme(specs, geom)
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
  caps() {
    return Cap.getAll(this.geom)
  }

  sourceCentroid() {
    return getCentroid(this.sourceVertices().map((v) => v.vec))
  }

  /** Returns whether the given face is part of the source polyhedron (as opposed to a cap) */
  isSourceFace(face: Face) {
    return face.vertices.every((v) => !this.capInnerVertIndices().has(v.index))
  }
}

export class AugmentedClassicalForme extends CompositeForme {
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
}
