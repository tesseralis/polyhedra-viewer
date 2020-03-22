import Structure from "./Structure"
import { Polygon } from "../polygons"
import { PrismaticType } from "./common"

interface PrismaticData {
  base: Polygon
  type: PrismaticType
}

/**
 * A prismatic uniform polyhedron is a prism or antiprism:
 * https://en.wikipedia.org/wiki/Prismatic_uniform_polyhedron
 */
export default class Prismatic extends Structure<PrismaticData> {
  constructor(data: PrismaticData) {
    super("prismatic", data)
  }
}
