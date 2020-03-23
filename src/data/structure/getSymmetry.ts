import { Symmetry, Polyhedral, Cyclic, Dihedral } from "../symmetry/Symmetry"
import type Structure from "./Structure"

const elementaryMapping: Record<string, Symmetry> = {
  sphenocorona: Cyclic.biradial,
  "augmented sphenocorona": Cyclic.bilateral,
  sphenomegacorona: Cyclic.biradial,
  hebesphenomegacorona: Cyclic.biradial,
  disphenocingulum: Dihedral.get(2, "antiprism"),
  bilunabirotunda: Dihedral.get(2, "prism"),
  "triangular hebesphenorotunda": Cyclic.get(3),
}

export default function getSymmetry(structure: Structure): Symmetry {
  return structure.visit<Symmetry>({
    exceptional({ family, operation }) {
      return Polyhedral.get(family, operation === "snub")
    },
    prismatic({ base, type }) {
      return Dihedral.get(base, type)
    },
    capstone({ base, type, count, elongation, gyrate }) {
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
    composite({ augmented = 0, gyrate = 0, diminished = 0, base, align }) {
      const count = augmented + gyrate + diminished
      const pure =
        count === augmented || count === diminished || count === gyrate
      switch (count) {
        case 0: {
          return base.symmetry()
        }
        case 1: {
          if (base.type === "prismatic") {
            // Mono-augmented prisms all have biradial symmetry
            return Cyclic.biradial
          } else {
            // FIXME make sure we type this correctly using a visitor
            return Cyclic.get((base.data as any).family)
          }
        }

        case 2: {
          // FIXME support all the nonessential types of augmented/diminished/gyrate solids
          if (base.type === "prismatic") {
            // para-augmented prisms have digonal prismatic symmetry
            // meta-augmented prisms have biradial symmetry
            return align === "para" ? Dihedral.get(2, "prism") : Cyclic.biradial
          } else {
            const basePolygon = (base.data as any).base
            if (basePolygon === 4) {
              return Dihedral.get(4, "prism")
            }
            if (align === "para") {
              return pure
                ? Dihedral.get(basePolygon, "antiprism")
                : Cyclic.get(basePolygon)
            } else {
              return pure ? Cyclic.biradial : Cyclic.bilateral
            }
          }
        }
        case 3: {
          if (base.type === "prismatic") {
            return Dihedral.get(3, "prism")
          } else {
            return pure ? Cyclic.get(3) : Cyclic.bilateral
          }
        }

        case 4: {
          // The only way this would happen is an augmented tridiminished icosahedron
          // TODO assert that this is the case
          return Cyclic.get(3)
        }
      }
      throw new Error("laksdjfaskdjf")
    },
    modifiedAntiprism({ base, operation }) {
      const { base: basePolygon } = base.data
      switch (operation) {
        case "rectified":
          return Dihedral.get(basePolygon, "prism")
        case "snub":
          return Dihedral.get(basePolygon, "antiprism")
        default:
          return base.symmetry()
      }
    },
    elementary({ base }) {
      return elementaryMapping[base]
    },
    default() {
      throw new Error("unsupported")
    },
  })
}
