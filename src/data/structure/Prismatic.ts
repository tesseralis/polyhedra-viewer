import Structure from "./Structure"
import { polygons, Polygon } from "../polygons"
import { prismaticTypes, PrismaticType, DataOptions } from "./common"

interface PrismaticData {
  base: Polygon
  type: PrismaticType
}

const options: DataOptions<PrismaticData> = {
  base: polygons,
  type: prismaticTypes,
}

/**
 * A prismatic uniform polyhedron is a prism or antiprism:
 * https://en.wikipedia.org/wiki/Prismatic_uniform_polyhedron
 */
export default class Prismatic extends Structure<PrismaticData> {
  constructor(data: PrismaticData) {
    super("prismatic", data)
  }

  static *getAll() {
    for (const base of options.base) {
      for (const type of options.type) {
        yield new Prismatic({ base, type })
      }
    }
  }
}
