import { isEqual, capitalize } from "lodash-es"
import type Classical from "./Classical"
import type Prismatic from "./Prismatic"
import type Capstone from "./Capstone"
import type Composite from "./Composite"
import type ModifiedAntiprism from "./ModifiedAntiprism"
import type Elementary from "./Elementary"
import getSymmetry from "./getSymmetry"
import getName from "./getName"
import getConwaySymbol from "./getConwaySymbol"
import type { Symmetry } from "../symmetry"
import { getAlternateNames, getCanonicalName } from "../alternates"

type PolyhedronType =
  | "classical"
  | "prismatic"
  | "capstone"
  | "composite"
  | "modified antiprism"
  | "elementary"

export default abstract class PolyhedronSpecs<Data extends {} = {}> {
  type: PolyhedronType
  data: Data

  constructor(type: PolyhedronType, data: Data) {
    this.type = type
    this.data = data
  }

  name(): string {
    return getName(this)
  }

  canonicalName() {
    return getCanonicalName(this.name())
  }

  alternateNames() {
    return getAlternateNames(this.canonicalName())
  }

  symmetry(): Symmetry {
    return getSymmetry(this)
  }

  conwaySymbol(): string {
    return getConwaySymbol(this)
  }

  group() {
    if (this.isClassical()) {
      return this.isRegular() ? "Platonic solid" : "Archimedean solid"
    }
    if (this.isPrismatic()) {
      return capitalize(this.data.type)
    }
    return "Johnson solid"
  }

  isUniform() {
    return this.isClassical() || this.isPrismatic()
  }

  isChiral() {
    // Should be overwritten by things that are chiral
    return false
  }

  equals(s2: PolyhedronSpecs) {
    return this.type === s2.type && isEqual(this.data, s2.data)
  }

  isHoneycomb() {
    return [
      "cube",
      "truncated octahedron",
      "triangular prism",
      "hexagonal prism",
      "gyrobifastigium",
    ].includes(this.canonicalName())
  }

  isClassical(): this is Classical {
    return this.type === "classical"
  }

  isPrismatic(): this is Prismatic {
    return this.type === "prismatic"
  }

  isCapstone(): this is Capstone {
    return this.type === "capstone"
  }

  isComposite(): this is Composite {
    return this.type === "composite"
  }

  isModifiedAntiprism(): this is ModifiedAntiprism {
    return this.type === "modified antiprism"
  }

  isElementary(): this is Elementary {
    return this.type === "elementary"
  }
}
