import Structure from "./Structure"
import { DataOptions } from "./common"
import Queries from "./Queries"

// FIXME type this with polygon
type Family = 3 | 4 | 5
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
  family: [3, 4, 5],
  facet: ["face", "vertex"],
  operation: ["regular", "truncate", "rectify", "bevel", "cantellate", "snub"],
}

/**
 * An exceptional uniform polyhedron is a Platonic or Archimedean solid.
 *
 * The name "exceptional" is taken from Wikipedia:
 * https://en.wikipedia.org/wiki/Uniform_polyhedron
 */
export default class Exceptional extends Structure<ExceptionalData> {
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
