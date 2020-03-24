import { Symmetry, Polyhedral, Cyclic, Dihedral } from "../symmetry"
import type Structure from "./Structure"
import type Composite from "./Composite"
import type Capstone from "./Capstone"

const elementaryMapping: Record<string, Symmetry> = {
  sphenocorona: Cyclic.biradial,
  "augmented sphenocorona": Cyclic.bilateral,
  sphenomegacorona: Cyclic.biradial,
  hebesphenomegacorona: Cyclic.biradial,
  disphenocingulum: Dihedral.get(2, "antiprism"),
  bilunabirotunda: Dihedral.get(2, "prism"),
  "triangular hebesphenorotunda": Cyclic.get(3),
}

function getCapstoneSymmetry({
  base,
  type,
  count,
  elongation,
  gyrate,
}: Capstone["data"]) {
  // mono-capstones always have cyclic symmetry
  if (count === 1) {
    return Cyclic.get(base)
  }
  const isGyroelongated = elongation === "antiprism"

  if (type === "pyramid") {
    return Dihedral.get(base, isGyroelongated ? "antiprism" : "prism")
  }
  // Cupolarotundae are always cyclic, and have reflective symmetry if it is not chiral
  if (type === "cupolarotunda") {
    return Cyclic.get(base, !!isGyroelongated)
  }
  // Bicupolae and birotundae
  if (isGyroelongated) {
    // Gyroelongated bicupolae and birotundae are chiral
    return Dihedral.get(base)
  }
  return Dihedral.get(base, gyrate === "gyro" ? "antiprism" : "prism")
}

function getCompositeSymmetry({
  augmented = 0,
  gyrate = 0,
  diminished = 0,
  base,
  align,
}: Composite["data"]) {
  const count = augmented + gyrate + diminished
  // A composite is "pure" only if it has one type of modification
  const pure = count === augmented || count === diminished || count === gyrate
  switch (count) {
    case 0:
      return base.symmetry()

    case 1:
      // Mono-augmented prisms all have biradial symmetry,
      // everything else has the symmetry of their base polygon
      return base.isPrismatic() ? Cyclic.biradial : Cyclic.get(base.data.family)

    case 2:
      if (base.isPrismatic()) {
        // para-augmented prisms have digonal prismatic symmetry
        // meta-augmented prisms have biradial symmetry
        return align === "para" ? Dihedral.get(2, "prism") : Cyclic.biradial
      }

      const basePolygon = base.data.family
      // Augmented cubes are always para- and thus have prismatic symmetry
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

    case 3:
      // The only tri-augmented prisms are triangular and hexagonal
      if (base.isPrismatic()) {
        return Dihedral.get(3, "prism")
      }

      // The only exceptional bases that can be tri-modified are
      // diminished icosahedra and modified rhombicosidodecahedra
      return pure ? Cyclic.get(3) : Cyclic.bilateral

    case 4:
      // The only way this would happen is an augmented tridiminished icosahedron
      return Cyclic.get(3)
  }

  throw new Error("The polyhedron has way too many modifications")
}

export default function getSymmetry(solid: Structure): Symmetry {
  if (solid.isExceptional()) {
    const { family, operation } = solid.data
    return Polyhedral.get(family, operation === "snub")
  }
  if (solid.isPrismatic()) {
    const { base, type } = solid.data
    return Dihedral.get(base, type)
  }
  if (solid.isCapstone()) {
    return getCapstoneSymmetry(solid.data)
  }
  if (solid.isComposite()) {
    return getCompositeSymmetry(solid.data)
  }
  if (solid.isModifiedAntiprism()) {
    const { base, operation } = solid.data
    switch (operation) {
      case "snub":
        return Dihedral.get(base.data.base, "antiprism")
      default:
        return base.symmetry()
    }
  }
  if (solid.isElementary()) {
    return elementaryMapping[solid.data.base]
  }
  throw new Error(`Solid is of invalid type ${solid.type}`)
}
