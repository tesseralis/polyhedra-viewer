import Structure from "./Structure"
import { Polygon } from "../polygons"
import { PrismaticType } from "./common"

interface Data {
  base: Polygon
  type: PrismaticType
}

/**
 * A prismatic uniform polyhedron is a prism or antiprism:
 * https://en.wikipedia.org/wiki/Prismatic_uniform_polyhedron
 */
export default class Prismatic extends Structure {
  data: Data

  constructor(data: Data) {
    super("prismatic")
    this.data = data
  }
}
