import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import { polygons, Polygon } from "../polygons"
import { prismaticTypes, PrismaticType, DataOptions } from "./common"

interface PrismaticData {
  base: 2 | Polygon
  type: PrismaticType
}

const options: DataOptions<PrismaticData> = {
  base: [2, ...polygons],
  type: prismaticTypes,
}

/**
 * A prismatic uniform polyhedron is a prism or antiprism:
 * https://en.wikipedia.org/wiki/Prismatic_uniform_polyhedron
 */
export default class Prismatic extends Specs<PrismaticData> {
  constructor(data: PrismaticData) {
    super("prismatic", data)
  }

  withData(data: Partial<PrismaticData>) {
    return new Prismatic({ ...this.data, ...data })
  }

  isPrism() {
    return this.data.type === "prism"
  }

  isAntiprism() {
    return this.data.type === "antiprism"
  }

  static *getAll() {
    for (const base of options.base) {
      for (const type of options.type) {
        // The digonal prism is just a square, so skip
        if (base === 2 && type === "prism") continue
        yield new Prismatic({ base, type })
      }
    }
  }

  static query = new Queries(Prismatic.getAll())
}
