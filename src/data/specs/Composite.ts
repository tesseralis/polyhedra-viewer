import { DataOptions } from "./common"

import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import Classical from "./Classical"
import Prismatic from "./Prismatic"

export type Count = 0 | 1 | 2 | 3
export const counts: Count[] = [0, 1, 2, 3]

interface CompositeData {
  source: Classical | Prismatic
  augmented?: Count
  diminished?: Count
  gyrate?: Count
  align?: "meta" | "para"
}

const prismaticBases = Prismatic.query.where(
  ({ type, base }) => type === "prism" && base <= 6,
)
const augmentedClassicalBases = Classical.query.where(
  ({ operation, facet }) =>
    ["regular", "truncate"].includes(operation) && facet !== "vertex",
)
const icosahedron = Classical.query.withName("icosahedron")
const rhombicosidodecahedron = Classical.query.withName(
  "rhombicosidodecahedron",
)

const options: DataOptions<CompositeData> = {
  source: [
    ...prismaticBases,
    ...augmentedClassicalBases,
    icosahedron,
    rhombicosidodecahedron,
  ],
  augmented: counts,
  diminished: counts,
  gyrate: counts,
  align: ["meta", "para"],
}

function limitCount<N extends number>(counts: N[], limit: number) {
  return counts.filter((n) => n <= limit)
}

/**
 * A composite Johnson solid consists of a Uniform polyhedron
 * with pyramids or cupolae added, removed, or gyrated from it.
 */
export default class Composite extends Specs<CompositeData> {
  constructor(data: CompositeData) {
    super("composite", data)
  }

  static *getAll() {
    // Augmented prisms
    for (const source of prismaticBases) {
      for (const augmented of limitCount(
        options.augmented,
        source.data.base % 3 === 0 ? 3 : 2,
      )) {
        if (source.data.base === 6 && augmented === 2) {
          for (const align of options.align) {
            yield new Composite({ source, augmented, align })
          }
        } else {
          yield new Composite({ source, augmented })
        }
      }
    }

    // Augmented classical polyhedra
    for (const source of augmentedClassicalBases) {
      for (const augmented of limitCount(
        options.augmented,
        source.data.family - 2,
      )) {
        if (source.data.family === 5 && augmented === 2) {
          for (const align of options.align) {
            yield new Composite({ source, augmented, align })
          }
        } else {
          yield new Composite({ source, augmented })
        }
      }
    }

    // TODO add more diminished and gyrate polyhedra

    // diminished icosahedra
    for (const diminished of options.diminished) {
      if (diminished === 2) {
        for (const align of options.align) {
          yield new Composite({ source: icosahedron, diminished, align })
        }
      } else {
        yield new Composite({ source: icosahedron, diminished })
      }
    }
    yield new Composite({ source: icosahedron, diminished: 3, augmented: 1 })

    // rhombicosidodecahedra
    for (const gyrate of options.gyrate) {
      for (const diminished of limitCount(options.diminished, 3 - gyrate)) {
        if (gyrate + diminished === 2) {
          for (const align of options.align) {
            yield new Composite({
              source: rhombicosidodecahedron,
              gyrate,
              diminished,
              align,
            })
          }
        } else {
          yield new Composite({
            source: rhombicosidodecahedron,
            gyrate,
            diminished,
          })
        }
      }
    }
  }

  static query = new Queries(Composite.getAll())
}
