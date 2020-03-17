import { Polygon, polygonPrefixes } from "../polygons"

type SymPolygon = 1 | 2 | Polygon

interface Metadata {
  /** True if the polyhedron is chiral */
  chiral: boolean
  /** The group notation of the symmetry group */
  group: string
  /** The base of the symmetry group */
  n?: SymPolygon
  /** The subscript to append when achiral */
  achiralSub: string
  /** The order of the rotation group */
  rotationalOrder: number
}

/**
 * A class containing symmetry information of a Polyhedron that can be expressed
 * as a string or a shorthand symbol, as well as the order of the symmetry group.
 */
export abstract class Symmetry {
  meta: Metadata

  constructor(meta: Metadata) {
    this.meta = meta
  }

  /**
   * Returns the name of this symmetry group.
   */
  abstract name(): string

  /**
   * Returns a symbol as a { base, sub } object.
   */
  symbol() {
    const { n, achiralSub, chiral } = this.meta
    const sub = `${n ?? ""}${chiral ? "" : achiralSub}`
    return { base: this.meta.group, sub }
  }

  /**
   * Returns a symbol as a string in the form {base}_{sub}.
   */
  symbolStr() {
    const { base, sub } = this.symbol()
    if (!sub) return base
    return `${base}_${sub}`
  }

  /**
   * Returns the order of this symmetry group.
   */
  order() {
    return this.meta.rotationalOrder * (this.meta.chiral ? 1 : 2)
  }
}

export type Family = "tetrahedral" | "octahedral" | "icosahedral"

const polyhedralOrders: Record<Family, number> = {
  tetrahedral: 12,
  octahedral: 24,
  icosahedral: 60,
}

interface PolyhedralData {
  family: Family
  chiral?: boolean
}

export class Polyhedral extends Symmetry {
  private data: PolyhedralData
  constructor(data: PolyhedralData) {
    const { family, chiral } = data
    super({
      group: family[0].toUpperCase(),
      achiralSub: family === "tetrahedral" ? "d" : "h",
      chiral: !!chiral,
      rotationalOrder: polyhedralOrders[family],
    })
    this.data = data
  }

  name() {
    const { family, chiral } = this.data
    return `${chiral ? "chiral" : "full"} ${family}`
  }

  static get(family: Family, chiral?: boolean) {
    return new Polyhedral({ family, chiral })
  }
}

interface CyclicData {
  n: SymPolygon
  chiral?: boolean
}

export class Cyclic extends Symmetry {
  private data: CyclicData
  constructor(data: CyclicData) {
    const { chiral, n } = data
    super({
      group: "C",
      n,
      achiralSub: "v",
      chiral: !!chiral,
      rotationalOrder: n,
    })
    this.data = data
  }

  name() {
    const { n, chiral } = this.data
    if (n === 1 && !chiral) return "bilateral"
    if (n === 2 && !chiral) return "biradial"
    const prefix = polygonPrefixes.get(n)
    return chiral ? prefix : `${prefix} pyramidal`
  }

  static get(n: SymPolygon, chiral?: boolean) {
    return new Cyclic({ n, chiral })
  }

  static bilateral = Cyclic.get(1)

  static biradial = Cyclic.get(2)
}

interface DihedralData {
  n: SymPolygon
  reflection?: "prism" | "antiprism"
}

export class Dihedral extends Symmetry {
  private data: DihedralData
  constructor(data: DihedralData) {
    const { reflection, n } = data
    super({
      group: "D",
      n,
      achiralSub: reflection === "prism" ? "h" : "d",
      chiral: !reflection,
      rotationalOrder: n * 2,
    })
    this.data = data
  }

  name() {
    const { n, reflection } = this.data
    const base = !!reflection ? `${reflection}atic` : "dihedral"
    return `${polygonPrefixes.get(n)} ${base}`
  }

  static get(n: SymPolygon, reflection?: "prism" | "antiprism") {
    return new Dihedral({ n, reflection })
  }
}
