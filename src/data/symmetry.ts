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

type Symmetry = PolyhedralSymmetry | CyclicSymmetry | DihedralSymmetry

function cyclic(n: number, chiral?: boolean): CyclicSymmetry {
  return { type: "cyclic", n, chiral }
}
const biradial = cyclic(2)
const bilateral = cyclic(1)

function dihedral(
  n: number,
  reflection?: "prism" | "antiprism",
): DihedralSymmetry {
  return {
    type: "dihedral",
    n,
    reflection,
  }
}

function polyhedral(family: Family, chiral?: boolean): PolyhedralSymmetry {
  return { type: "polyhedral", family, chiral }
}

function getCapstoneSymmetry(name: string) {
  const { base, type, count, elongation, gyrate } = capstones.get(name)
  // Single-count capstones all have pyramidal symmetry
  if (count === 1) {
    return cyclic(base)
  }
  const gyroelongated = elongation === "antiprism"

  if (type === "pyramid") {
    return dihedral(base, gyroelongated ? "antiprism" : "prism")
  } else if (type === "cupolarotunda") {
    return cyclic(base, !!gyroelongated)
  } else {
    // cupolae and rotundae
    const reflection = gyroelongated
      ? undefined
      : gyrate === "gyro"
      ? "antiprism"
      : "prism"
    return dihedral(base, reflection)
  }
}

function getAugmentedPrismSymmetry(name: string) {
  const { count, align } = augmentedPrisms.get(name)
  switch (count) {
    case 1: {
      // mono-augmented prisms all have biradial symmetry
      return biradial
    }
    case 2: {
      if (align === "para") {
        // para-augmented stuff have digonal prismatic symmetry
        // TODO this doesn't count a square prism (cube)
        return dihedral(2, "prism")
      } else {
        // meta-augmented stuff has biradial symmetry
        return biradial
      }
    }
    case 3: {
      // Triaugmented triangular/hexagonal prism has triangular prismatic symmetry
      return dihedral(3, "prism")
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
      return cyclic(base)
    case 2:
      if (base === 4) {
        return dihedral(4, "prism")
      }
      return align === "para" ? dihedral(5, "antiprism") : biradial
    case 3:
      return cyclic(3)
    default:
      return getClassicalSymmetry(name)
  }
}

// TODO there's only three of these so we just put them here right now
const diminishedIcosahedraMapping: Record<string, Symmetry> = {
  "metabidiminished icosahedron": biradial,
  "tridiminished icosahedron": cyclic(3),
  "augmented tridiminished icosahedron": cyclic(3),
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
      return cyclic(5)
    case 2:
      if (align === "para") {
        return pure ? dihedral(5, "antiprism") : cyclic(5)
      }
      return pure ? biradial : bilateral
    //
    case 3:
      return pure ? cyclic(3) : bilateral
    default:
      throw new Error(
        `Way too many changes to this polyhedron: gyrate=${gyrate}, diminished=${diminished}`,
      )
  }
}

const elementaryMapping: Record<string, Symmetry> = {
  "snub disphenoid": dihedral(2, "antiprism"),
  "snub square antiprism": dihedral(4, "antiprism"),
  sphenocorona: biradial,
  "augmented sphenocorona": bilateral,
  sphenomegacorona: biradial,
  hebesphenomegacorona: biradial,
  disphenocingulum: dihedral(2, "antiprism"),
  bilunabirotunda: dihedral(2, "prism"),
  "triangular hebesphenorotunda": cyclic(3),
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
  return polyhedral(groupNames[family], chiral)
}

function getPrismSymmetry(name: string) {
  const { base, type } = prisms.get(name)!
  return dihedral(base, type)
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

export function getSymmetryName(symmetry: Symmetry) {
  switch (symmetry.type) {
    case "polyhedral": {
      const { family, chiral } = symmetry
      return `${chiral ? "chiral" : "full"} ${family}`
    }
    case "cyclic": {
      const { n, chiral } = symmetry
      if (n === 1 && !chiral) return "bilateral"
      if (n === 2 && !chiral) return "biradial"
      // FIXME type n correctly
      const prefix = polygonPrefixes.get(n as any)
      return chiral ? prefix : `${prefix} pyramidal`
    }
    case "dihedral": {
      const { n, reflection } = symmetry
      const base = !!reflection ? `${reflection}atic` : "dihedral"
      return `${polygonPrefixes.get(n as any)} ${base}`
    }
  }
}

function symbolJoin(base: string, sub?: string) {
  if (sub) {
    return `${base}_${sub}`
  }
  return base
}

export function getSymmetrySymbol(symmetry: Symmetry) {
  switch (symmetry.type) {
    case "polyhedral": {
      const { family, chiral } = symmetry
      const sub = !chiral ? (family === "tetrahedral" ? "d" : "h") : ""
      return symbolJoin(family[0].toUpperCase(), sub)
    }
    case "cyclic": {
      const { n, chiral } = symmetry
      const sub = n === 1 && !chiral ? "s" : `${n}${chiral ? "" : "v"}`
      return symbolJoin("C", sub)
    }
    case "dihedral": {
      const { n, reflection } = symmetry
      const sub = !!reflection ? (reflection === "prism" ? "h" : "d") : ""
      return symbolJoin("D", `${n}${sub}`)
    }
  }
}

const polyhedralOrders: Record<Family, number> = {
  tetrahedral: 12,
  octahedral: 24,
  icosahedral: 60,
}

function chiralMult(n: number, chiral?: boolean) {
  return n * (!!chiral ? 1 : 2)
}

export function getOrder(symmetry: Symmetry) {
  switch (symmetry.type) {
    case "polyhedral": {
      const { family, chiral } = symmetry
      return chiralMult(polyhedralOrders[family], chiral)
    }
    case "cyclic": {
      const { n, chiral } = symmetry
      return chiralMult(n, chiral)
    }
    case "dihedral": {
      const { n, reflection } = symmetry
      return chiralMult(2 * n, !reflection)
    }
  }
}
