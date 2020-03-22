import Structure from "./Structure"
import { PrismaticType } from "./common"

type CapstoneType = "pyramid" | "cupola" | "rotunda" | "cupolarotunda"

interface Data {
  // FIXME type this with polygon
  base: 2 | 3 | 4 | 5
  type: CapstoneType
  elongation: null | PrismaticType
  count: 1 | 2
  // FIXME rename to "alignment?"
  gyrate?: "ortho" | "gyro"
}

/**
 * A capstone polyhedron is a pyramid, cupola or rotunda that has been elongated
 * or doubled.
 */
export default class Capstone extends Structure {
  data: Data

  constructor(data: Data) {
    super("capstone")
    this.data = data
  }
}
