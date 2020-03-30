import { PrimaryPolygon, primaryPolygons } from "../polygons"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import { DataOptions, PrismaticType, prismaticTypes } from "./common"

type CapstoneType = "pyramid" | "cupola" | "rotunda" | "cupolarotunda"

interface CapstoneData {
  base: 2 | PrimaryPolygon
  type: CapstoneType
  elongation: null | PrismaticType
  count: 1 | 2
  gyrate?: "ortho" | "gyro"
}

const options: DataOptions<CapstoneData> = {
  base: [2, ...primaryPolygons],
  type: ["pyramid", "cupola", "rotunda", "cupolarotunda"],
  elongation: [null, ...prismaticTypes],
  count: [1, 2],
  gyrate: ["ortho", "gyro"],
}

/**
 * A capstone polyhedron is a pyramid, cupola or rotunda that has been elongated
 * or doubled.
 */
export default class Capstone extends Specs<CapstoneData> {
  constructor(data: CapstoneData) {
    super("capstone", data)
  }

  withData(data: Partial<CapstoneData>) {
    const newData = { ...this.data, ...data }
    if (newData.elongation === "antiprism") {
      delete newData.gyrate
    }
    return new Capstone(newData)
  }

  isPyramid = () => this.data.type === "pyramid"
  isCupola = () => this.data.type === "cupola"
  isRotunda = () => this.data.type === "rotunda"
  isCupolaRotunda = () => this.data.type === "cupolarotunda"

  isMono = () => this.data.count === 1
  isBi = () => this.data.count === 2

  isShortened = () => !this.data.elongation
  isElongated = () => this.data.elongation === "prism"
  isGyroelongated = () => this.data.elongation === "antiprism"

  static *getAll() {
    for (const base of options.base.slice(1)) {
      for (const type of options.type) {
        // Only pentagonal rotundae exist
        if (["rotunda", "cupolarotunda"].includes(type) && base !== 5) {
          continue
        }
        for (const elongation of options.elongation) {
          // Gyroelongated pyramids are concave
          if (base === 3 && type === "pyramid" && elongation === "antiprism") {
            continue
          }
          for (const count of options.count) {
            // Cupola-rotundae only exist if there are two of them
            if (type === "cupolarotunda" && count !== 2) {
              continue
            }
            // Only cupolae, rotundae can be ortho or gyro
            if (
              count === 2 &&
              type !== "pyramid" &&
              elongation !== "antiprism"
            ) {
              for (const gyrate of options.gyrate) {
                yield new Capstone({
                  base,
                  type,
                  elongation,
                  count,
                  gyrate,
                })
              }
            } else {
              yield new Capstone({ base, type, elongation, count })
            }
          }
        }
      }
    }
    yield new Capstone({ base: 2, type: "cupola", elongation: null, count: 1 })
    yield new Capstone({
      base: 2,
      type: "cupola",
      elongation: null,
      count: 2,
      gyrate: "gyro",
    })
  }

  static query = new Queries(Capstone.getAll())
  static options = options
}
