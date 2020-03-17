import { polygonPrefixes } from "../polygons"

export type Family = "tetrahedral" | "octahedral" | "icosahedral"

interface PolyhedralSymmetry {
  family: Family
  chiral?: boolean
}

interface CyclicSymmetry {
  n: number
  chiral?: boolean
}

interface DihedralSymmetry {
  n: number
  reflection?: "prism" | "antiprism"
}

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

const polyhedralOrders: Record<Family, number> = {
  tetrahedral: 12,
  octahedral: 24,
  icosahedral: 60,
}

export class Polyhedral extends Symmetry {
  private data: PolyhedralSymmetry
  constructor(data: PolyhedralSymmetry) {
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

export class Cyclic extends Symmetry {
  private data: CyclicSymmetry
  constructor(data: CyclicSymmetry) {
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

export class Dihedral extends Symmetry {
  private data: DihedralSymmetry
  constructor(data: DihedralSymmetry) {
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
