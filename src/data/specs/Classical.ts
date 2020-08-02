import { Items } from "types"
import { PrimaryPolygon, primaryPolygons, Twist } from "./common"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"

export const families = primaryPolygons
export type Family = PrimaryPolygon

export const facets = ["face", "vertex"] as const
export type Facet = Items<typeof facets>
export function oppositeFacet(facet: Facet) {
  return facet === "face" ? "vertex" : "face"
}

export const operations = [
  "regular",
  "truncate",
  "rectify",
  "bevel",
  "cantellate",
  "snub",
] as const
export type Operation = Items<typeof operations>

interface ClassicalData {
  family: Family
  facet?: Facet
  operation: Operation
  twist?: Twist
}

/**
 * An classical uniform polyhedron is a Platonic or Archimedean solid.
 */
export default class Classical extends Specs<ClassicalData> {
  private constructor(data: ClassicalData) {
    super("classical", data)
    if (!this.hasFacet()) {
      delete this.data.facet
    }
    if (!this.isChiral()) {
      delete this.data.twist
    }
    // Set a default twist for snub solids
    if (this.isChiral() && !this.data.twist) {
      this.data.twist = "left"
    }
  }

  withData(data: Partial<ClassicalData>) {
    // TODO don't create a new item
    return new Classical({ ...this.data, ...data })
  }

  withOperation(operation: Operation, twist?: Twist) {
    return this.withData({ operation, twist })
  }

  isTetrahedral = () => this.data.family === 3
  isOctahedral = () => this.data.family === 4
  isIcosahedral = () => this.data.family === 5

  isRegular = () => this.data.operation === "regular"
  isTruncated = () => this.data.operation === "truncate"
  isRectified = () => this.data.operation === "rectify"
  isBevelled = () => this.data.operation === "bevel"
  isCantellated = () => this.data.operation === "cantellate"
  isSnub = () => this.data.operation === "snub"

  hasFacet = () => Classical.hasFacet(this.data.operation)
  facet() {
    if (!this.data.facet) throw new Error(`Spec ${this.name()} has no facet`)
    return this.data.facet
  }

  isFace = () => this.data.facet === "face"
  isVertex = () => this.data.facet === "vertex"

  isChiral = () => this.isSnub()

  static hasFacet(operation: Operation) {
    return ["regular", "truncate"].includes(operation)
  }

  static *getAll() {
    for (const operation of operations) {
      for (const family of families) {
        if (this.hasFacet(operation)) {
          for (const facet of facets) {
            yield new Classical({ family, operation, facet })
          }
        } else {
          yield new Classical({ family, operation })
        }
      }
    }
  }

  static query = new Queries(Classical.getAll())

  static allWithOperation(operation: Operation) {
    return this.query.where((s) => s.data.operation === operation)
  }
}
