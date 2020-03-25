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

interface ExceptionalData {
  family: Family
  facet?: Facet
  operation: Operation
}

const options: DataOptions<ExceptionalData> = {
  family: primaryPolygons,
  facet: ["face", "vertex"],
  operation: ["regular", "truncate", "rectify", "bevel", "cantellate", "snub"],
}

/**
 * An exceptional uniform polyhedron is a Platonic or Archimedean solid.
 *
 * The name "exceptional" is taken from Wikipedia:
 * https://en.wikipedia.org/wiki/Uniform_polyhedron
 */
export default class Exceptional extends Specs<ExceptionalData> {
  constructor(data: ExceptionalData) {
    super("exceptional", data)
  }

  static *getAll() {
    for (const operation of options.operation) {
      for (const family of options.family) {
        if (family !== 3 && ["regular", "truncate"].includes(operation)) {
          for (const facet of options.facet) {
            yield new Exceptional({ family, operation, facet })
          }
        } else {
          yield new Exceptional({ family, operation })
        }
      }
    }
  }

  static query = new Queries(Exceptional.getAll())
}
