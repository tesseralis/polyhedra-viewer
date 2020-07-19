import { Items, Twist } from "types"
import { PrimaryPolygon, primaryPolygons } from "../polygons"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import { PrismaticType, prismaticTypes } from "./common"

const elongations = [null, ...prismaticTypes]

const counts = [1, 2] as const
type Count = Items<typeof counts>

const gyrations = ["ortho", "gyro"] as const
type Gyration = Items<typeof gyrations>

const capTypes = ["pyramid", "cupola", "rotunda", "cupolarotunda"] as const
type CapstoneType = Items<typeof capTypes>

interface CapstoneData {
  base: 2 | PrimaryPolygon
  type: CapstoneType
  elongation: null | PrismaticType
  count: Count
  gyrate?: Gyration
  twist?: Twist
}

/**
 * A capstone polyhedron is a pyramid, cupola or rotunda that has been elongated
 * or doubled.
 */
export default class Capstone extends Specs<CapstoneData> {
  private constructor(data: CapstoneData) {
    super("capstone", data)
    if (this.isGyroelongated() || this.isMono()) {
      delete this.data.gyrate
    }
    if (!this.isChiral()) {
      delete this.data.twist
    }
    if (this.isChiral() && !this.data.twist) {
      this.data.twist = "left"
    }
  }

  withData(data: Partial<CapstoneData>) {
    return new Capstone({ ...this.data, ...data })
  }

  isDigonal = () => this.data.base === 2
  isTriangular = () => this.data.base === 3
  isSquare = () => this.data.base === 4
  isPentagonal = () => this.data.base === 5

  isPyramid = () => this.data.type === "pyramid"
  isCupola = () => this.data.type === "cupola"
  isRotunda = () => this.data.type === "rotunda"
  isCupolaRotunda = () => this.data.type === "cupolarotunda"

  isMono = () => this.data.count === 1
  isBi = () => this.data.count === 2

  isShortened = () => !this.data.elongation
  isElongated = () => this.data.elongation === "prism"
  isGyroelongated = () => this.data.elongation === "antiprism"

  // Overwrite from PolyhedronSpec
  isChiral = () => this.isGyroelongated() && this.isBi() && !this.isPyramid()

  static *getAll() {
    for (const base of primaryPolygons) {
      for (const type of capTypes) {
        // Only pentagonal rotundae exist
        if (["rotunda", "cupolarotunda"].includes(type) && base !== 5) {
          continue
        }
        for (const elongation of elongations) {
          // Gyroelongated pyramids are concave
          if (base === 3 && type === "pyramid" && elongation === "antiprism") {
            continue
          }
          for (const count of counts) {
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
              for (const gyrate of gyrations) {
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
}
