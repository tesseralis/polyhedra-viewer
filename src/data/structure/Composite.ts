// FIXME I think counts might just go here
import { DataOptions, Count, counts } from "./common"

import Structure from "./Structure"
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

const options: DataOptions<CompositeData> = {
  // FIXME only allow the bases that are valid
  base: [...Exceptional.getAll(), ...Prismatic.getAll()],
  augmented: counts,
  diminished: counts,
  gyrate: counts,
  align: ["meta", "para"],
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
    // FIXME fill in with more stuff
    for (const base of options.base) {
      yield new Composite({ base })
    }
    // probably handle augment, diminish and rhombicos seperately
  }
}
