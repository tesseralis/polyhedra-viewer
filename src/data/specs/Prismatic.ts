import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import { polygons, Polygon } from "../polygons"
import { prismaticTypes, PrismaticType } from "./common"

const bases = [2, ...polygons] as const

interface PrismaticData {
  base: 2 | Polygon
  type: PrismaticType
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

  isPrism = () => this.data.type === "prism"
  isAntiprism = () => this.data.type === "antiprism"

  static *getAll() {
    for (const base of bases) {
      for (const type of prismaticTypes) {
        // The digonal prism is just a square, so skip
        if (base === 2 && type === "prism") continue
        yield new Prismatic({ base, type })
      }
    }
  }

  static query = new Queries(Prismatic.getAll())
}
