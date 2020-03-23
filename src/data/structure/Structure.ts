import Exceptional from "./Exceptional"
import Prismatic from "./Prismatic"
import Capstone from "./Capstone"
import Composite from "./Composite"
import ModifiedAntiprism from "./ModifiedAntiprism"
import Elementary from "./Elementary"
import getSymmetry from "./getSymmetry"
import getName from "./getName"
import getConwaySymbol from "./getConwaySymbol"
import type { Symmetry } from "../symmetry/Symmetry"
import { getCanonicalName } from "../alternates"

const subclasses = [
  Exceptional,
  Prismatic,
  Capstone,
  Composite,
  ModifiedAntiprism,
  Elementary,
]

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

  static withName(name: string) {
    for (const Subclass of subclasses) {
      if (Subclass.query.hasName(name)) {
        return Subclass.query.withName(name)
      }
    }
    throw new Error(`Could not find structure with canonical name ${name}`)
  }

  name(): string {
    return getName(this)
  }

  canonicalName() {
    return getCanonicalName(this.name())
  }

  symmetry(): Symmetry {
    return getSymmetry(this)
  }

  conwaySymbol(): string {
    return getConwaySymbol(this)
  }

  group() {
    return this.visit({
      exceptional: ({ operation }) =>
        operation === "regular" ? "Platonic solid" : "Archimedean solid",
      prismatic: ({ type }) => type,
      default: () => "Johnson solid",
    })
  }

  isRegular() {
    return this.visit({
      exceptional: ({ operation }) => operation === "regular",
      default: () => false,
    })
  }

  isQuasiRegular() {
    return this.visit({
      exceptional: ({ operation }) => operation === "rectify",
      default: () => false,
    })
  }

  isUniform() {
    return this.visit({
      exceptional: () => true,
      prismatic: () => true,
      default: () => false,
    })
  }

  isChiral() {
    return this.visit({
      exceptional: ({ operation }) => operation === "snub",
      capstone: ({ elongation, count, type }) =>
        elongation === "antiprism" && count == 2 && type !== "pyramid",
      default: () => false,
    })
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
      throw new Error("Incorrect case")
    }
    return visitor.default()
  }
}
