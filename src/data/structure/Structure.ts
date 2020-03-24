import { capitalize } from "lodash-es"
import type Exceptional from "./Exceptional"
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

interface StructureVisitor<Result> {
  exceptional?(data: Exceptional["data"]): Result
  prismatic?(data: Prismatic["data"]): Result
  capstone?(data: Capstone["data"]): Result
  composite?(data: Composite["data"]): Result
  modifiedAntiprism?(data: ModifiedAntiprism["data"]): Result
  elementary?(data: Elementary["data"]): Result
  default?(): Result
}

export default abstract class Structure<Data extends {} = {}> {
  type: string
  data: Data

  constructor(type: string, data: Data) {
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
    if (this.isExceptional()) {
      return this.isRegular() ? "Platonic solid" : "Archimedean solid"
    }
    if (this.isPrismatic()) {
      return capitalize(this.data.type)
    }
    return "Johnson solid"
  }

  isRegular() {
    if (this.isExceptional()) {
      return this.data.operation === "regular"
    }
    return false
  }

  isQuasiRegular() {
    // FIXME kludge used to make `sharpen` work
    if (this.canonicalName() === "octahedron") return true
    if (this.isExceptional()) {
      return this.data.operation === "rectify"
    }
    return false
  }

  isUniform() {
    return this.isExceptional() || this.isPrismatic()
  }

  isChiral() {
    if (this.isExceptional()) {
      return this.data.operation === "snub"
    }
    if (this.isCapstone()) {
      const { elongation, count, type } = this.data
      return elongation === "antiprism" && count === 2 && type !== "pyramid"
    }
    return false
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

  isExceptional(): this is Exceptional {
    return this.type === "exceptional"
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

  visit<Result>(visitor: StructureVisitor<Result>): Result {
    if (this.isExceptional() && !!visitor.exceptional) {
      return visitor.exceptional(this.data)
    }
    if (this.isPrismatic() && !!visitor.prismatic) {
      return visitor.prismatic(this.data)
    }
    if (this.isCapstone() && !!visitor.capstone) {
      return visitor.capstone(this.data)
    }
    if (this.isComposite() && !!visitor.composite) {
      return visitor.composite(this.data)
    }
    if (this.isModifiedAntiprism() && !!visitor.modifiedAntiprism) {
      return visitor.modifiedAntiprism(this.data)
    }
    if (this.isElementary() && !!visitor.elementary) {
      return visitor.elementary(this.data)
    }
    if (!visitor.default) {
      throw new Error("No default provided")
    }
    return visitor.default()
  }
}