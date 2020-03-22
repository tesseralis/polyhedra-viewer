import { Count } from "./common"

import Structure from "./Structure"
import Exceptional from "./Exceptional"
import Prismatic from "./Prismatic"

interface CompositeData {
  // FIXME have a "Uniform" type
  base: Exceptional | Prismatic
  augmented: Count
  diminished: Count
  gyrate: Count
  // FIXME rename to "positioning"?
  align: "meta" | "para"
}

/**
 * A composite Johnson solid consists of a Uniform polyhedron
 * with pyramids or cupolae added, removed, or gyrated from it.
 */
export default class Composite extends Structure<CompositeData> {
  constructor(data: CompositeData) {
    super("modified", data)
  }
}
