import { range } from "lodash-es"
import { Items, Twist, oppositeTwist } from "types"
import { Polygon, PrimaryPolygon, primaryPolygons } from "../polygons"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import { PrismaticType, prismaticTypes } from "./common"

const elongations = ["null", ...prismaticTypes] as const

const counts = [0, 1, 2] as const
type Count = Items<typeof counts>

export const gyrations = ["ortho", "gyro"] as const
export type Gyration = Items<typeof gyrations>

export const polygonTypes = ["primary", "secondary"]
export type PolygonType = Items<typeof polygonTypes>

export const capTypes = ["pyramid", "cupola", "rotunda"] as const
export type CapType = Items<typeof capTypes>

interface CapstoneData {
  base: 2 | PrimaryPolygon
  type: PolygonType
  elongation: "null" | PrismaticType
  count: Count
  rotundaCount?: Count
  gyrate?: Gyration
  twist?: Twist
}

// Only pentagonal secondary has rotundae
function rotundaCounts(
  type: PolygonType,
  base: PrimaryPolygon,
  count: Count,
): Count[] {
  if (type === "primary" || base !== 5) return [0]
  return range(0, count + 1) as Count[]
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
    if (!this.isPentagonal() && !this.isSecondary()) {
      this.data.rotundaCount = 0
    }
  }

  withData(data: Partial<CapstoneData>) {
    return new Capstone({ ...this.data, ...data })
  }

  withElongation(elongation: PrismaticType | "null", twist?: Twist) {
    return this.withData({ elongation, twist })
  }

  isDigonal = () => this.data.base === 2
  isTriangular = () => this.data.base === 3
  isSquare = () => this.data.base === 4
  isPentagonal = () => this.data.base === 5

  isPrimary = () => this.data.type === "primary"
  isSecondary = () => this.data.type === "secondary"

  isPrismatic = () => this.data.count === 0
  isMono = () => this.data.count === 1
  isBi = () => this.data.count === 2

  isShortened = () => this.data.elongation === "null"
  isElongated = () => this.data.elongation === "prism"
  isGyroelongated = () => this.data.elongation === "antiprism"

  isGyro = () => this.data.gyrate === "gyro"
  isOrtho = () => this.data.gyrate === "ortho"

  // Overwrite from PolyhedronSpec
  isChiral = () => this.isGyroelongated() && this.isBi() && this.isSecondary()

  isPrism = () => this.isPrismatic() && this.isElongated()
  isAntiprism = () => this.isPrismatic() && this.isGyroelongated()

  isPyramid = () => this.isPrimary()
  isCupola = () => this.isSecondary() && this.data.rotundaCount === 0
  isRotunda = () => this.data.count === this.data.rotundaCount
  isCupolaRotunda = () => this.isBi() && this.data.rotundaCount === 1

  capType(): CapType {
    if (this.isPyramid()) return "pyramid"
    if (this.isCupola()) return "cupola"
    if (this.isRotunda()) return "rotunda"
    if (this.isCupolaRotunda())
      throw new Error(`Cupolarotunda does not have a single cap type`)
    throw new Error(`Prismatic solid does not have a cap`)
  }

  capTypes(): CapType[] {
    if (this.isCupolaRotunda()) return ["cupola", "rotunda"]
    return [this.capType()]
  }

  remove(capType: CapType) {
    return this.withData({
      count: (this.data.count - 1) as Count,
      rotundaCount: (this.data.rotundaCount! -
        (capType === "rotunda" ? 1 : 0)) as Count,
    })
  }

  baseSides = () => (this.data.base * (this.isPrimary() ? 1 : 2)) as Polygon
  prismaticType(): PrismaticType {
    if (!this.isPrismatic()) {
      throw new Error(`Tried to get prism type of non-prismatic`)
    }
    return this.data.elongation as PrismaticType
  }

  gyrate() {
    if (this.isGyroelongated()) {
      return this.withData({
        twist: oppositeTwist(this.data.twist!),
      })
    }
    return this.withData({
      gyrate: this.data.gyrate === "ortho" ? "gyro" : "ortho",
    })
  }

  hasGyrate = () => Capstone.hasGyrate(this.data)

  /** Return true if this solid has a gyrate option */
  static hasGyrate({ count, type, elongation }: CapstoneData) {
    return count === 2 && type === "secondary" && elongation !== "antiprism"
  }

  static *getAll() {
    for (const base of primaryPolygons) {
      for (const type of polygonTypes) {
        for (const elongation of elongations) {
          for (const count of counts) {
            // Gyroelongated pyramids are concave
            if (
              count > 0 &&
              base === 3 &&
              type === "primary" &&
              elongation === "antiprism"
            ) {
              continue
            }
            // Prismatic stuff without elongation doesn't exist
            if (count === 0 && elongation === "null") {
              continue
            }
            for (const rotundaCount of rotundaCounts(type, base, count)) {
              // Only cupolae, rotundae can be ortho or gyro
              if (this.hasGyrate({ count, type, elongation, base })) {
                for (const gyrate of gyrations) {
                  yield new Capstone({
                    base,
                    type,
                    elongation,
                    count,
                    rotundaCount,
                    gyrate,
                  })
                }
              } else {
                yield new Capstone({
                  base,
                  type,
                  elongation,
                  count,
                  rotundaCount,
                })
              }
            }
          }
        }
      }
    }
    // Digonal antiprism
    yield new Capstone({
      base: 2,
      type: "primary",
      elongation: "antiprism",
      count: 0,
    })
    // Fastigium
    yield new Capstone({
      base: 2,
      type: "secondary",
      elongation: "null",
      count: 1,
      rotundaCount: 0,
    })
    // Gyrobifastigium
    yield new Capstone({
      base: 2,
      type: "secondary",
      elongation: "null",
      count: 2,
      rotundaCount: 0,
      gyrate: "gyro",
    })
  }

  static query = new Queries(Capstone.getAll())
}
