import { omit, isEqual } from "lodash-es"
import { Items } from "types"

import Specs from "./PolyhedronSpecs"
import Queries from "./Queries"
import Classical from "./Classical"
import Prismatic from "./Prismatic"

export const counts = [0, 1, 2, 3] as const
export type Count = Items<typeof counts>

const alignments = ["meta", "para"] as const
type Align = Items<typeof alignments>

interface CompositeData {
  source: Classical | Prismatic
  augmented: Count
  diminished: Count
  gyrate: Count
  align?: Align
}

const prismaticBases = Prismatic.query.where(
  (s) => s.isPrism() && s.data.base <= 6,
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
  }: Partial<CompositeData> & { source: Prismatic | Classical }) {
    super("composite", { source, align, augmented, diminished, gyrate })
    if (!this.isBi()) {
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

  isPara = () => this.data.align === "para"
  isMeta = () => this.data.align === "meta"

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
        if (source.data.base === 6 && augmented === 2) {
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
