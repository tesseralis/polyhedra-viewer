import { trimEnd } from "lodash-es"

import johnsonSolids from "./groups/johnson.json"
import johnsonSymmetries from "./johnsonSymmetries"
import { polygonPrefixes } from "./polygons"
import { classicals, prisms, capstones, augmentedPrisms } from "./tables"
import { isValidSolid } from "."

function getCapstoneSymmetry(name: string) {
  const { base, type, count, elongation, gyrate } = capstones.get(name)
  // Single-count capstones all have pyramidal symmetry
  if (count === 1) {
    return { group: "C", sub: `${base}v` }
  }
  const gyroelongated = elongation === "antiprism"

  if (type === "pyramid") {
    const notation = gyroelongated ? "d" : "h"
    return { group: "D", sub: `${base}${notation}` }
  } else if (type === "cupolarotunda") {
    const notation = gyroelongated ? "" : "v"
    return { group: "C", sub: `${base}${notation}` }
  } else {
    // cupolae and rotundae
    const notation = gyroelongated ? "" : gyrate === "gyro" ? "d" : "h"
    return { group: "D", sub: `${base}${notation}` }
  }
}

function getAugmentedPrismSymmetry(name: string) {
  const { count, align } = augmentedPrisms.get(name)
  switch (count) {
    case 1: {
      // mono-augmented prisms all have biradial symmetry
      return { group: "C", sub: "2v" }
    }
    case 2: {
      if (align === "para") {
        // para-augmented stuff have digonal prismatic symmetry
        // TODO this doesn't count a square prism (cube)
        return { group: "D", sub: "2h" }
      } else {
        // meta-augmented stuff has biradial symmetry
        return { group: "C", sub: "2v" }
      }
    }
    case 3: {
      // Triaugmented triangular/hexagonal prism has triangular prismatic symmetry
      return { group: "D", sub: "3h" }
    }
    default: {
      // for zero-counts, return the usual prism symmetry
      return getPrismSymmetry(name)
    }
  }
}

// TODO replace the Johnson symmetries list to rely on tables
function getJohnsonSymmetry(name: string) {
  if (capstones.hasName(name)) {
    return getCapstoneSymmetry(name)
  }
  if (augmentedPrisms.hasName(name)) {
    return getAugmentedPrismSymmetry(name)
  }
  return johnsonSymmetries[johnsonSolids.indexOf(name)]
}

/**
 * Utilities to get symmetry information out of polyhedra names
 */

interface Symmetry {
  group: string
  sub: string
}

const groupNames = { 3: "T", 4: "O", 5: "I" }

function getClassicalSymmetry(name: string) {
  // Don't want to count it in the tetrahedron group
  const families = [...classicals.options.family].reverse()
  const family = families.find(family => classicals.hasName(name, { family }))!
  // TODO replace with isChiral
  const chiral = classicals.hasName(
    name,
    ({ operation, family }) => operation === "snub" && family !== 3,
  )
  return { group: groupNames[family], sub: chiral ? "" : "h" }
}

const prismSub = { prism: "h", antiprism: "d" }

function getPrismSymmetry(name: string) {
  const { base, type } = prisms.get(name)!
  return { group: "D", sub: `${base}${prismSub[type]}` }
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

export function getSymmetryName({ group, sub }: Symmetry) {
  if ("TOI".includes(group)) {
    const prefix = sub === "h" ? "full" : "chiral"
    const base = (() => {
      switch (group) {
        case "T":
          return "tetrahedral"
        case "O":
          return "octahedral"
        case "I":
          return "icosahedral"
        default:
          return ""
      }
    })()
    return `${prefix} ${base}`
  }
  if (group === "C") {
    if (sub === "s") {
      return "bilateral"
    }
    if (sub === "2v") {
      return "biradial"
    }
    const n = parseInt(trimEnd(sub, "v"), 10)
    if (polygonPrefixes.hasKey(n)) {
      return polygonPrefixes.get(n) + " pyramidal"
    }
  }
  if (group === "D") {
    const last = sub.substr(sub.length - 1)
    if (last === "h") {
      const n = parseInt(trimEnd(sub, "h"), 10)
      if (polygonPrefixes.hasKey(n)) {
        return polygonPrefixes.get(n) + " prismatic"
      }
    }
    if (last === "d") {
      const n = parseInt(trimEnd(sub, "d"), 10)
      if (polygonPrefixes.hasKey(n)) {
        return polygonPrefixes.get(n) + " antiprismatic"
      }
    }

    const n = parseInt(sub, 10)
    if (polygonPrefixes.hasKey(n)) {
      return polygonPrefixes.get(n) + " dihedral"
    }
  }
  throw new Error("invalid group")
}

// TODO lots of repeated logic as with getting the display name
export function getOrder(name: string) {
  const { group, sub } = getSymmetry(name)
  if ("TOI".includes(group)) {
    const mult = sub === "h" ? 2 : 1
    const base = (() => {
      switch (group) {
        case "T":
          return 12
        case "O":
          return 24
        case "I":
          return 60
        default:
          return 0
      }
    })()
    return base * mult
  }
  if (group === "C") {
    if (sub === "s") {
      return 2
    }
    const n = parseInt(trimEnd(sub, "v"), 10)
    return 2 * n
  }
  if (group === "D") {
    const last = sub.substr(sub.length - 1)
    if (last === "h") {
      const n = parseInt(trimEnd(sub, "h"), 10)
      return 4 * n
    }
    if (last === "d") {
      const n = parseInt(trimEnd(sub, "d"), 10)
      return 4 * n
    }

    const n = parseInt(sub, 10)
    return 2 * n
  }
  throw new Error("invalid group")
}
