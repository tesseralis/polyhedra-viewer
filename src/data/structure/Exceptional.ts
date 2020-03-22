import Structure from "./Structure"

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
}
