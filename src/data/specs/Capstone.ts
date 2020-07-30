import { range } from "lodash-es"
import { Items, Twist } from "types"
import { Polygon, PrimaryPolygon, primaryPolygons } from "../polygons"
import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import { PrismaticType, prismaticTypes } from "./common"

const elongations = [null, ...prismaticTypes]

const counts = [0, 1, 2] as const
type Count = Items<typeof counts>

export const gyrations = ["ortho", "gyro"] as const
export type Gyration = Items<typeof gyrations>

const capTypes = ["primary", "secondary"]
type CapstoneType = Items<typeof capTypes>

interface CapstoneData {
  base: 2 | PrimaryPolygon
  type: CapstoneType
  elongation: null | PrismaticType
  count: Count
  rotundaCount?: Count
  gyrate?: Gyration
  twist?: Twist
}

// Only pentagonal secondary has rotundae
function rotundaCounts(
  type: CapstoneType,
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

  isDigonal = () => this.data.base === 2
  isTriangular = () => this.data.base === 3
  isSquare = () => this.data.base === 4
  isPentagonal = () => this.data.base === 5

  isPrimary = () => this.data.type === "primary"
  isSecondary = () => this.data.type === "secondary"

  isPrismatic = () => this.data.count === 0
  isMono = () => this.data.count === 1
  isBi = () => this.data.count === 2

  isShortened = () => !this.data.elongation
  isElongated = () => this.data.elongation === "prism"
  isGyroelongated = () => this.data.elongation === "antiprism"

  isGyro = () => this.data.gyrate === "gyro"
  isOrtho = () => this.data.gyrate === "ortho"

  // Overwrite from PolyhedronSpec
  isChiral = () => this.isGyroelongated() && this.isBi() && this.isSecondary()

  isPrism = () => this.isPrismatic() && this.isElongated()
  isAntiprism = () => this.isPrismatic() && this.isGyroelongated()

  isCupolaRotunda = () => this.isBi() && this.data.rotundaCount === 1

  baseSides = () => (this.data.base * (this.isPrimary() ? 1 : 2)) as Polygon
  prismaticType() {
    if (!this.isPrismatic() || !this.data.elongation) {
      throw new Error(
        `Tried to get prism type of non-prismatic: ${this.name()}`,
      )
    }
    return this.data.elongation
  }

  static *getAll() {
    for (const base of primaryPolygons) {
      for (const type of capTypes) {
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
            if (count === 0 && !elongation) {
              continue
            }
            for (const rotundaCount of rotundaCounts(type, base, count)) {
              // Only cupolae, rotundae can be ortho or gyro
              if (
                count === 2 &&
                type === "secondary" &&
                elongation !== "antiprism"
              ) {
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
      elongation: null,
      count: 1,
      rotundaCount: 0,
    })
    // Gyrobifastigium
    yield new Capstone({
      base: 2,
      type: "cupola",
      elongation: null,
      count: 2,
      rotundaCount: 0,
      gyrate: "gyro",
    })
  }

  static query = new Queries(Capstone.getAll())
}
