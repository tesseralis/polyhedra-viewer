import { PrimaryPolygon, primaryPolygons } from "../polygons"
import Specs from "./PolyhedronSpecs"
import { DataOptions } from "./common"
import Queries from "./Queries"

type Family = PrimaryPolygon
type Facet = "face" | "vertex"
type Operation =
  | "regular"
  | "truncate"
  | "rectify"
  | "bevel"
  | "cantellate"
  | "snub"

interface ClassicalData {
  family: Family
  facet?: Facet
  operation: Operation
}

const options: DataOptions<ClassicalData> = {
  family: primaryPolygons,
  facet: ["face", "vertex"],
  operation: ["regular", "truncate", "rectify", "bevel", "cantellate", "snub"],
}

/**
 * An classical uniform polyhedron is a Platonic or Archimedean solid.
 */
export default class Classical extends Specs<ClassicalData> {
  private constructor(data: ClassicalData) {
    super("classical", data)
    if (
      this.isTetrahedral() ||
      !["regular", "truncate"].includes(this.data.operation)
    ) {
      delete this.data.facet
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

  isFace = () => this.data.facet === "face"
  isVertex = () => this.data.facet === "vertex"

  static *getAll() {
    for (const operation of options.operation) {
      for (const family of options.family) {
        if (family !== 3 && ["regular", "truncate"].includes(operation)) {
          for (const facet of options.facet) {
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
