import visitTables from "../tables/visitTables"
import { assertValidSolid } from "../common"
import { Family, Symmetry, Polyhedral, Cyclic, Dihedral } from "./Symmetry"

const groupNames: Record<3 | 4 | 5, Family> = {
  3: "tetrahedral",
  4: "octahedral",
  5: "icosahedral",
}

const elementaryMapping: Record<string, Symmetry> = {
  sphenocorona: Cyclic.biradial,
  "augmented sphenocorona": Cyclic.bilateral,
  sphenomegacorona: Cyclic.biradial,
  hebesphenomegacorona: Cyclic.biradial,
  disphenocingulum: Dihedral.get(2, "antiprism"),
  bilunabirotunda: Dihedral.get(2, "prism"),
  "triangular hebesphenorotunda": Cyclic.get(3),
}

// FIXME I don't wanna just throw an error...
function getClassicalSymmetry(name: string): Symmetry {
  throw new Error("Invalid polyhedron")
}

/**
 * Return the Symmetry of the given polyhedron name
 */
export default function getSymmetry(name: string): Symmetry {
  assertValidSolid(name)

  return visitTables(name, {
    classicals({ family, operation }) {
      return Polyhedral.get(groupNames[family], operation === "snub")
    },
    prisms({ base, type }) {
      return Dihedral.get(base, type)
    },
    capstones({ base, type, count, elongation, gyrate }) {
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
    },
    augmentedPrisms({ count, align }) {
      switch (count) {
        case 1:
          // mono-augmented prisms all have biradial symmetry
          return Cyclic.biradial
        case 2:
          // para-augmented stuff have digonal prismatic symmetry
          // meta-augmented stuff has biradial symmetry
          return align === "para" ? Dihedral.get(2, "prism") : Cyclic.biradial
        case 3:
          // Triaugmented triangular/hexagonal prism has triangular prismatic symmetry
          return Dihedral.get(3, "prism")
        default:
          // for zero-counts, return the usual prism symmetry
          throw new Error("reached invalid code")
      }
    },
    augmentedClassicals({ count, base, align }) {
      switch (count) {
        case 1:
          return Cyclic.get(base)
        case 2:
          if (base === 4) {
            return Dihedral.get(4, "prism")
          }
          return align === "para"
            ? Dihedral.get(5, "antiprism")
            : Cyclic.biradial
        case 3:
          return Cyclic.get(3)
        default:
          throw new Error("reached invalid code")
      }
    },
    diminishedIcosahedra({ count, align }) {
      switch (count) {
        case 3:
          return Cyclic.get(3)
        case 2:
          return align === "meta"
            ? Cyclic.biradial
            : Dihedral.get(5, "antiprism")
        case 1:
          return Cyclic.get(5)
        default:
          throw new Error("Reached invalid code")
      }
    },
    rhombicosidodecahedra({ gyrate, diminished, align }) {
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
          return pure ? Cyclic.biradial : Cyclic.bilateral
        //
        case 3:
          return pure ? Cyclic.get(3) : Cyclic.bilateral
        default:
          throw new Error(
            `Way too many changes to this polyhedron: gyrate=${gyrate}, diminished=${diminished}`,
          )
      }
    },
    snubAntiprisms({ base }) {
      return Dihedral.get(base, "antiprism")
    },
    default() {
      return elementaryMapping[name]
    },
  })
}
