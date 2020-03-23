// FIXME I think counts might just go here
import { DataOptions, Count, counts } from "./common"

import Structure from "./Structure"
import Queries from "./Queries"
import Exceptional from "./Exceptional"
import Prismatic from "./Prismatic"

interface CompositeData {
  // FIXME have a "Uniform" type
  base: Exceptional | Prismatic
  augmented?: Count
  diminished?: Count
  gyrate?: Count
  // FIXME rename to "positioning"?
  align?: "meta" | "para"
}

const prismaticBases = Prismatic.query.where(
  ({ type, base }) => type === "prism" && base <= 6,
)
const augmentedExceptionalBases = Exceptional.query.where(
  ({ operation, facet }) =>
    ["regular", "truncated"].includes(operation) && facet !== "vertex",
)
const icosahedron = Exceptional.query.withName("icosahedron")
const rhombicosidodecahedron = Exceptional.query.withName(
  "rhombicosidodecahedron",
)

const options: DataOptions<CompositeData> = {
  base: [
    ...prismaticBases,
    ...augmentedExceptionalBases,
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
export default class Composite extends Structure<CompositeData> {
  constructor(data: CompositeData) {
    super("modified", data)
  }

  static *getAll() {
    // Augmented prisms
    for (const base of prismaticBases) {
      for (const augmented of limitCount(
        options.augmented,
        base.data.base % 3 === 0 ? 3 : 2,
      )) {
        if (base.data.base === 6 && augmented === 2) {
          for (const align of options.align) {
            yield new Composite({ base, augmented, align })
          }
        } else {
          yield new Composite({ base, augmented })
        }
      }
    }

    // Augmented exceptional polyhedra
    for (const base of augmentedExceptionalBases) {
      for (const augmented of limitCount(
        options.augmented,
        base.data.family - 2,
      )) {
        if (base.data.family === 5 && augmented === 2) {
          for (const align of options.align) {
            yield new Composite({ base, augmented, align })
          }
        } else {
          yield new Composite({ base, augmented })
        }
      }
    }

    // TODO add more diminished and gyrate polyhedra

    // diminished icosahedra
    for (const diminished of options.diminished) {
      if (diminished === 2) {
        for (const align of options.align) {
          yield new Composite({ base: icosahedron, diminished, align })
        }
      } else {
        yield new Composite({ base: icosahedron, diminished })
      }
    }
    yield new Composite({ base: icosahedron, diminished: 3, augmented: 1 })

    // rhombicosidodecahedra
    for (const gyrate of options.gyrate) {
      for (const diminished of limitCount(options.diminished, 3 - gyrate)) {
        if (gyrate + diminished === 2) {
          for (const align of options.align) {
            yield new Composite({
              base: rhombicosidodecahedron,
              gyrate,
              diminished,
              align,
            })
          }
        } else {
          yield new Composite({
            base: rhombicosidodecahedron,
            gyrate,
            diminished,
          })
        }
      }
    }
  }

  static query = new Queries(Composite.getAll())
}
