import { polygonPrefixes } from "../polygons"

interface Metadata {
  chiral: boolean
  groupSymbol: string
  rotationalOrder: number
}

export abstract class Symmetry {
  meta: Metadata

  constructor(meta: Metadata) {
    this.meta = meta
  }

  // Get the "symbol" of the symmetry
  abstract name(): string
  // Get the subscript of the symbol
  abstract symbolSub(): string

  symbol() {
    return { base: this.meta.groupSymbol, sub: this.symbolSub() }
  }

  symbolStr() {
    const { base, sub } = this.symbol()
    if (!sub) return base
    return `${base}_${sub}`
  }

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
      groupSymbol: family[0].toUpperCase(),
      chiral: !!chiral,
      rotationalOrder: polyhedralOrders[family],
    })
    this.data = data
  }

  name() {
    const { family, chiral } = this.data
    return `${chiral ? "chiral" : "full"} ${family}`
  }

  symbolSub() {
    const { family, chiral } = this.data
    if (chiral) return ""
    return family === "tetrahedral" ? "d" : "h"
  }

  static get(family: Family, chiral?: boolean) {
    return new Polyhedral({ family, chiral })
  }
}

interface CyclicData {
  n: number
  chiral?: boolean
}

export class Cyclic extends Symmetry {
  private data: CyclicData
  constructor(data: CyclicData) {
    const { chiral, n } = data
    super({ groupSymbol: "C", chiral: !!chiral, rotationalOrder: n })
    this.data = data
  }

  name() {
    const { n, chiral } = this.data
    if (n === 1 && !chiral) return "bilateral"
    if (n === 2 && !chiral) return "biradial"
    // FIXME type n correctly
    const prefix = polygonPrefixes.get(n as any)
    return chiral ? prefix : `${prefix} pyramidal`
  }

  symbolSub() {
    const { n, chiral } = this.data
    return `${n}${chiral ? "" : "v"}`
  }

  static get(n: number, chiral?: boolean) {
    return new Cyclic({ n, chiral })
  }

  static bilateral = Cyclic.get(1)

  static biradial = Cyclic.get(2)
}

interface DihedralData {
  n: number
  reflection?: "prism" | "antiprism"
}

export class Dihedral extends Symmetry {
  private data: DihedralData
  constructor(data: DihedralData) {
    const { reflection, n } = data
    super({
      groupSymbol: "D",
      chiral: !reflection,
      rotationalOrder: n * 2,
    })
    this.data = data
  }

  name() {
    const { n, reflection } = this.data
    const base = !!reflection ? `${reflection}atic` : "dihedral"
    return `${polygonPrefixes.get(n as any)} ${base}`
  }

  symbolSub() {
    const { n, reflection } = this.data
    if (!reflection) return `${n}`
    return n + (reflection === "prism" ? "h" : "d")
  }

  static get(n: number, reflection?: "prism" | "antiprism") {
    return new Dihedral({ n, reflection })
  }
}
