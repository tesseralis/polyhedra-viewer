import { Items, Twist } from "types"
import { PrimaryPolygon, primaryPolygons } from "../polygons"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"

const families = primaryPolygons
export type Family = PrimaryPolygon

export const facets = ["face", "vertex"] as const
export type Facet = Items<typeof facets>

const operations = [
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
    return new Classical({ ...this.data, ...data })
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

  hasFacet = () => this.isRegular() || this.isTruncated()

  isFace = () => this.data.facet === "face"
  isVertex = () => this.data.facet === "vertex"

  isChiral = () => this.isSnub()

  static *getAll() {
    for (const operation of operations) {
      for (const family of families) {
        if (["regular", "truncate"].includes(operation)) {
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
}
