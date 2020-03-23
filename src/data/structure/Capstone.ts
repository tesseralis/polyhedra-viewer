import Structure from "./Structure"
import { DataOptions, PrismaticType, prismaticTypes } from "./common"

type CapstoneType = "pyramid" | "cupola" | "rotunda" | "cupolarotunda"

interface CapstoneData {
  // FIXME type this with polygon
  base: 2 | 3 | 4 | 5
  type: CapstoneType
  elongation: null | PrismaticType
  count: 1 | 2
  // FIXME rename to "alignment?"
  gyrate?: "ortho" | "gyro"
}

const options: DataOptions<CapstoneData> = {
  base: [2, 3, 4, 5],
  type: ["pyramid", "cupola", "rotunda", "cupolarotunda"],
  elongation: [null, ...prismaticTypes],
  count: [1, 2],
  gyrate: ["ortho", "gyro"],
}

/**
 * A capstone polyhedron is a pyramid, cupola or rotunda that has been elongated
 * or doubled.
 */
export default class Capstone extends Structure<CapstoneData> {
  constructor(data: CapstoneData) {
    super("capstone", data)
  }

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
}
