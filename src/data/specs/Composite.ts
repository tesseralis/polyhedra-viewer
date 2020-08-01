import { omit, isEqual } from "lodash-es"
import { Items } from "types"

import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import Classical from "./Classical"
import Capstone from "./Capstone"

export const counts = [0, 1, 2, 3] as const
export type Count = Items<typeof counts>

export const alignments = ["meta", "para"] as const
export type Align = Items<typeof alignments>

interface CompositeData {
  source: Classical | Capstone
  augmented: Count
  diminished: Count
  gyrate: Count
  align?: Align
}

const prismaticBases = Capstone.query.where(
  (s) => s.isPrism() && (s.isPrimary() || s.isTriangular()),
)
const augmentedClassicalBases = Classical.query.where(
  (s) => s.hasFacet() && !s.isVertex(),
)
const icosahedron = Classical.query.withName("icosahedron")
const rhombicosidodecahedron = Classical.query.withName(
  "rhombicosidodecahedron",
)

function limitCount(limit: number) {
  return counts.filter((n) => n <= limit)
}

/**
 * A composite Johnson solid consists of a Uniform polyhedron
 * with pyramids or cupolae added, removed, or gyrated from it.
 */
export default class Composite extends Specs<CompositeData> {
  private constructor({
    augmented = 0,
    diminished = 0,
    gyrate = 0,
    source,
    align,
  }: Partial<CompositeData> & { source: Capstone | Classical }) {
    super("composite", { source, align, augmented, diminished, gyrate })
    if (!this.hasAlignemnt()) {
      delete this.data.align
    }
  }

  withData(data: Partial<CompositeData>) {
    return new Composite({ ...this.data, ...data })
  }

  totalCount() {
    const { augmented, diminished, gyrate } = this.data
    return augmented + diminished + gyrate
  }

  isMono = () => this.totalCount() === 1
  isBi = () => this.totalCount() === 2
  isTri = () => this.totalCount() === 3

  isAugmented = () => this.data.augmented > 0
  isDiminished = () => this.data.diminished > 0
  isGyrate = () => this.data.gyrate > 0

  isAugmentedPrism() {
    return this.data.source.isCapstone()
  }

  isAugmentedClassical() {
    const { source } = this.data
    if (!source.isClassical()) return false
    if (source.isTruncated()) return true
    return source.isRegular() && source.isFace()
  }

  isAugmentedSolid() {
    return this.isAugmentedPrism() || this.isAugmentedClassical()
  }

  isDiminishedSolid() {
    const { source } = this.data
    return source.isClassical() && source.isRegular() && source.isVertex()
  }

  isGyrateSolid() {
    const { source } = this.data
    return source.isClassical() && source.isCantellated()
  }

  isPara = () => this.data.align === "para"
  isMeta = () => this.data.align === "meta"

  hasAlignemnt() {
    if (!this.isBi()) return false
    if (this.isAugmentedPrism()) return this.sourcePrism().isSecondary()
    if (this.isAugmentedClassical())
      return this.sourceClassical().isIcosahedral()
    return true
  }

  sourcePrism() {
    const { source } = this.data
    if (!source.isCapstone()) {
      throw new Error(`Source is not a prism: ${source.name()}`)
    }
    return source
  }

  sourceClassical() {
    const { source } = this.data
    if (!source.isClassical()) {
      throw new Error(`Source is not a classical solid: ${source.name()}`)
    }
    return source
  }

  diminish() {
    if (!this.isAugmentedSolid())
      throw new Error(`diminish() only implemented for augmented solids`)
    return this.withData({
      augmented: (this.data.augmented - 1) as Count,
      align: "meta",
    })
  }

  augmentDiminished(triangular?: boolean) {
    if (!this.isDiminishedSolid())
      throw new Error(
        `augmentDiminished() only implemented for diminished solids`,
      )
    if (triangular) {
      return this.withData({ augmented: 1 })
    }
    return this.withData({
      diminished: (this.data.diminished - 1) as Count,
      align: "meta",
    })
  }

  augmentGyrate(gyrate: "ortho" | "gyro") {
    if (!this.isGyrateSolid())
      throw new Error(`augmentGyrate() only implemented for gyrate solids`)
    if (gyrate === "ortho") {
      return this.withData({
        gyrate: (this.data.gyrate + 1) as Count,
        diminished: (this.data.diminished - 1) as Count,
      })
    }
    return this.withData({
      diminished: (this.data.diminished - 1) as Count,
      align: "meta",
    })
  }

  ungyrate() {
    return this.withData({
      gyrate: (this.data.gyrate - 1) as Count,
      align: "meta",
    })
  }

  equals(s2: Specs) {
    if (!s2.isComposite()) return false
    // Recursively compare the source data and other data
    const { source, ...data } = this.data
    const source2: Specs = s2.data.source
    const data2: Omit<CompositeData, "source"> = omit(s2.data, "source")
    return source.equals(source2) && isEqual(data, data2)
  }

  static *getAll() {
    // Augmented prisms
    for (const source of prismaticBases) {
      for (const augmented of limitCount(source.data.base % 3 === 0 ? 3 : 2)) {
        if (source.isSecondary() && augmented === 2) {
          for (const align of alignments) {
            yield new Composite({ source, augmented, align })
          }
        } else {
          yield new Composite({ source, augmented })
        }
      }
    }

    // Augmented classical polyhedra
    for (const source of augmentedClassicalBases) {
      for (const augmented of limitCount(source.data.family - 2)) {
        if (source.isIcosahedral() && augmented === 2) {
          for (const align of alignments) {
            yield new Composite({ source, augmented, align })
          }
        } else {
          yield new Composite({ source, augmented })
        }
      }
    }

    // TODO add more diminished and gyrate polyhedra

    // diminished icosahedra
    for (const diminished of counts) {
      if (diminished === 2) {
        for (const align of alignments) {
          yield new Composite({ source: icosahedron, diminished, align })
        }
      } else {
        yield new Composite({ source: icosahedron, diminished })
      }
    }
    yield new Composite({ source: icosahedron, diminished: 3, augmented: 1 })

    // rhombicosidodecahedra
    for (const gyrate of counts) {
      for (const diminished of limitCount(3 - gyrate)) {
        if (gyrate + diminished === 2) {
          for (const align of alignments) {
            yield new Composite({
              source: rhombicosidodecahedron,
              gyrate,
              diminished,
              align,
            })
          }
        } else {
          yield new Composite({
            source: rhombicosidodecahedron,
            gyrate,
            diminished,
          })
        }
      }
    }
  }

  static query = new Queries(Composite.getAll())
}
