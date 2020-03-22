import { Count } from "./common"

import Structure from "./Structure"
import Exceptional from "./Exceptional"
import Prismatic from "./Prismatic"

interface Data {
  // FIXME have a "Uniform" type
  base: Exceptional | Prismatic
  augmented: Count
  diminished: Count
  gyrate: Count
  // FIXME rename to "positioning"?
  alignment: "meta" | "para"
}

/**
 * A modified Johnson solid consists of a Uniform polyhedron
 * with pyramids or cupolae added, removed, or gyrated from it.
 */
export default class Modified extends Structure {
  data: Data
  constructor(data: Data) {
    super("modified")
    this.data = data
  }
}
