import { polygonPrefixes } from "./polygons"
import {
  classicals,
  prisms,
  capstones,
  augmentedPrisms,
  augmentedClassicals,
  rhombicosidodecahedra,
} from "./tables"
import { isValidSolid } from "."

type Family = "tetrahedral" | "octahedral" | "icosahedral"

interface PolyhedralSymmetry {
  type: "polyhedral"
  family: Family
  chiral?: boolean
}

interface CyclicSymmetry {
  type: "cyclic"
  n: number
  chiral?: boolean
}

interface DihedralSymmetry {
  type: "dihedral"
  n: number
  reflection?: "prism" | "antiprism"
}

type SymmetryData = PolyhedralSymmetry | CyclicSymmetry | DihedralSymmetry

abstract class Symmetry {
  chiral: boolean
  groupSymbol: string

  constructor(groupSymbol: string, chiral: boolean) {
    this.groupSymbol = groupSymbol
    this.chiral = chiral
  }

  // Get the "symbol" of the symmetry
  abstract name(): string
  // Get the subscript of the symbol
  abstract symbolSub(): string

  symbol() {
    return { base: this.groupSymbol, sub: this.symbolSub() }
  }

  // Get the order of the symmetry NOT including chirality
  abstract rotationalOrder(): number
  order() {
    return this.rotationalOrder() * (this.chiral ? 1 : 2)
  }
}

const polyhedralOrders: Record<Family, number> = {
  tetrahedral: 12,
  octahedral: 24,
  icosahedral: 60,
}

class Polyhedral extends Symmetry {
  private data: PolyhedralSymmetry
  constructor(data: PolyhedralSymmetry) {
    super(data.family[0].toUpperCase(), !!data.chiral)
    this.data = data
  }

  name() {
    const { family, chiral } = this.data
    return `${chiral ? "chiral" : "full"} ${family}`
  }

  symbolSub() {
    const { family, chiral } = this.data
    if (!chiral) return ""
    return family === "tetrahedral" ? "d" : "h"
  }

  rotationalOrder() {
    return polyhedralOrders[this.data.family]
  }

  static get(family: Family, chiral?: boolean) {
    return new Polyhedral({ type: "polyhedral", family, chiral })
  }
}

class Cyclic extends Symmetry {
  private data: CyclicSymmetry
  constructor(data: CyclicSymmetry) {
    super("C", !!data.chiral)
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
    if (n === 1 && !chiral) return "s"
    return `${n}${chiral ? "" : "v"}`
  }

  rotationalOrder() {
    return this.data.n
  }

  static get(n: number, chiral?: boolean) {
    return new Cyclic({ type: "cyclic", n, chiral })
  }

  static bilateral() {
    return this.get(1)
  }

  static biradial() {
    return this.get(2)
  }
}

class Dihedral extends Symmetry {
  private data: DihedralSymmetry
  constructor(data: DihedralSymmetry) {
    super("C", !data.reflection)
    this.data = data
  }

  name() {
    const { n, reflection } = this.data
    const base = !!reflection ? `${reflection}atic` : "dihedral"
    return `${polygonPrefixes.get(n as any)} ${base}`
  }

  symbolSub() {
    const { reflection } = this.data
    if (!reflection) return ""
    return reflection === "prism" ? "h" : "d"
  }

  rotationalOrder() {
    return 2 * this.data.n
  }

  static get(n: number, reflection?: "prism" | "antiprism") {
    return new Dihedral({ type: "dihedral", n, reflection })
  }
}

function getCapstoneSymmetry(name: string) {
  const { base, type, count, elongation, gyrate } = capstones.get(name)
  // Single-count capstones all have pyramidal symmetry
  if (count === 1) {
    return Cyclic.get(base)
  }
  const gyroelongated = elongation === "antiprism"

  if (type === "pyramid") {
    return Dihedral.get(base, gyroelongated ? "antiprism" : "prism")
  } else if (type === "cupolarotunda") {
    return Cyclic.get(base, !!gyroelongated)
  } else {
    // cupolae and rotundae
    const reflection = gyroelongated
      ? undefined
      : gyrate === "gyro"
      ? "antiprism"
      : "prism"
    return Dihedral.get(base, reflection)
  }
}

function getAugmentedPrismSymmetry(name: string) {
  const { count, align } = augmentedPrisms.get(name)
  switch (count) {
    case 1: {
      // mono-augmented prisms all have biradial symmetry
      return Cyclic.biradial()
    }
    case 2: {
      if (align === "para") {
        // para-augmented stuff have digonal prismatic symmetry
        // TODO this doesn't count a square prism (cube)
        return Dihedral.get(2, "prism")
      } else {
        // meta-augmented stuff has biradial symmetry
        return Cyclic.biradial()
      }
    }
    case 3: {
      // Triaugmented triangular/hexagonal prism has triangular prismatic symmetry
      return Dihedral.get(3, "prism")
    }
    default: {
      // for zero-counts, return the usual prism symmetry
      return getPrismSymmetry(name)
    }
  }
}

function getAugmentedClassicalSymmetry(name: string) {
  const { count, base, align } = augmentedClassicals.get(name)
  switch (count) {
    case 1:
      return Cyclic.get(base)
    case 2:
      if (base === 4) {
        return Dihedral.get(4, "prism")
      }
      return align === "para" ? Dihedral.get(5, "antiprism") : Cyclic.biradial()
    case 3:
      return Cyclic.get(3)
    default:
      return getClassicalSymmetry(name)
  }
}

// TODO there's only three of these so we just put them here right now
const diminishedIcosahedraMapping: Record<string, Symmetry> = {
  "metabidiminished icosahedron": Cyclic.biradial(),
  "tridiminished icosahedron": Cyclic.get(3),
  "augmented tridiminished icosahedron": Cyclic.get(3),
}

function getRhombicosidodecahedraSymmetry(name: string) {
  const { gyrate, diminished, align } = rhombicosidodecahedra.get(name)
  // only gyrations or only diminishes
  const pure = !gyrate || !diminished
  switch (gyrate + diminished) {
    case 0:
      // normal rhombicosidodecahedron
      return getClassicalSymmetry(name)
    case 1:
      // pentagonal pyramidal
      return Cyclic.get(5)
    case 2:
      if (align === "para") {
        return pure ? Dihedral.get(5, "antiprism") : Cyclic.get(5)
      }
      return pure ? Cyclic.biradial() : Cyclic.bilateral()
    //
    case 3:
      return pure ? Cyclic.get(3) : Cyclic.bilateral()
    default:
      throw new Error(
        `Way too many changes to this polyhedron: gyrate=${gyrate}, diminished=${diminished}`,
      )
  }
}

const elementaryMapping: Record<string, Symmetry> = {
  "snub disphenoid": Dihedral.get(2, "antiprism"),
  "snub square antiprism": Dihedral.get(4, "antiprism"),
  sphenocorona: Cyclic.biradial(),
  "augmented sphenocorona": Cyclic.bilateral(),
  sphenomegacorona: Cyclic.biradial(),
  hebesphenomegacorona: Cyclic.biradial(),
  disphenocingulum: Dihedral.get(2, "antiprism"),
  bilunabirotunda: Dihedral.get(2, "prism"),
  "triangular hebesphenorotunda": Cyclic.get(3),
}

// TODO replace the Johnson symmetries list to rely on tables
function getJohnsonSymmetry(name: string) {
  if (capstones.hasName(name)) {
    return getCapstoneSymmetry(name)
  }
  if (augmentedPrisms.hasName(name)) {
    return getAugmentedPrismSymmetry(name)
  }
  if (augmentedClassicals.hasName(name)) {
    return getAugmentedClassicalSymmetry(name)
  }
  if (!!diminishedIcosahedraMapping[name]) {
    return diminishedIcosahedraMapping[name]
  }
  if (rhombicosidodecahedra.hasName(name)) {
    return getRhombicosidodecahedraSymmetry(name)
  }
  return elementaryMapping[name]
}

/**
 * Utilities to get symmetry information out of polyhedra names
 */

const groupNames: Record<3 | 4 | 5, Family> = {
  3: "tetrahedral",
  4: "octahedral",
  5: "icosahedral",
}

function getClassicalSymmetry(name: string) {
  // Don't want to count it in the tetrahedron group
  const families = [...classicals.options.family].reverse()
  const family = families.find(family => classicals.hasName(name, { family }))!
  // TODO replace with isChiral
  const chiral = classicals.hasName(
    name,
    ({ operation, family }) => operation === "snub" && family !== 3,
  )
  return Polyhedral.get(groupNames[family], chiral)
}

function getPrismSymmetry(name: string) {
  const { base, type } = prisms.get(name)!
  return Dihedral.get(base, type)
}

export function getSymmetry(name: string): Symmetry {
  if (!isValidSolid(name)) {
    throw new Error(`Unable to get symmetry for invalid polyhedron ${name}`)
  }
  if (classicals.hasName(name)) {
    return getClassicalSymmetry(name)
  }
  if (prisms.hasName(name)) {
    return getPrismSymmetry(name)
  }
  return getJohnsonSymmetry(name)
}
